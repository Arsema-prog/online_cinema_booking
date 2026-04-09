package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.PriceEvaluationRequest;
import com.cinema.supportservice.dto.PriceEvaluationResponse;
import com.cinema.supportservice.model.RuleSet;
import com.cinema.supportservice.repository.RuleSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RulesService {

    private static final String DEFAULT_RULESET_VERSION = "default-pricing-v1";
    private static final String DEFAULT_RULESET_NAME = "pricing.drl";
    private static final String DEFAULT_RULESET_RESOURCE = "pricing/pricing.drl";
    private static final String FALLBACK_RULE_VERSION = "fallback-no-active-ruleset";

    private final RuleSetRepository ruleSetRepository;
    private KieContainer kieContainer;
    private RuleSet activeRuleSet;

    @PostConstruct
    public void init() {
        ruleSetRepository.findByActiveTrue().ifPresentOrElse(
                ruleSet -> {
                    try {
                        compileAndSetContainer(ruleSet);
                        this.activeRuleSet = ruleSet;
                    } catch (Exception e) {
                        log.error("Failed to initialize active ruleset version {}. Falling back to defaults.",
                                ruleSet.getVersion(), e);
                        this.kieContainer = null;
                        this.activeRuleSet = null;
                    }
                },
                () -> log.warn("No active ruleset found at startup. Attempting to bootstrap defaults.")
        );

        if (this.kieContainer == null) {
            bootstrapDefaultRuleset();
        }
    }

    private void compileAndSetContainer(RuleSet ruleSet) {
        try {
            KieServices kieServices = KieServices.Factory.get();
            KieFileSystem kieFileSystem = kieServices.newKieFileSystem();
            // Keep DRL path aligned with package declaration to avoid Drools package mismatch warnings.
            kieFileSystem.write("src/main/resources/cinema/pricing/" + ruleSet.getVersion() + ".drl", ruleSet.getDrlContent());

            KieBuilder kieBuilder = kieServices.newKieBuilder(kieFileSystem).buildAll();
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                throw new RuntimeException("Compilation errors: " + kieBuilder.getResults().toString());
            }
            this.kieContainer = kieServices.newKieContainer(kieServices.getRepository().getDefaultReleaseId());
            this.activeRuleSet = ruleSet;
            log.info("Activated ruleset version: {}", ruleSet.getVersion());
        } catch (Exception e) {
            log.error("Failed to compile ruleset", e);
            throw new RuntimeException("Failed to compile ruleset", e);
        }
    }

    @Transactional
    public void activateRuleSet(RuleSet newRuleSet) {
        ruleSetRepository.findByActiveTrue().ifPresent(old -> {
            old.setActive(false);
            old.setActivatedAt(null);
            ruleSetRepository.save(old);
        });

        compileAndSetContainer(newRuleSet);

        newRuleSet.setActive(true);
        newRuleSet.setActivatedAt(Instant.now());
        ruleSetRepository.save(newRuleSet);
        this.activeRuleSet = newRuleSet;
    }

    @Transactional
    public void activateRuleSetByVersion(String version) {
        RuleSet ruleSet = ruleSetRepository.findByVersion(version)
                .orElseThrow(() -> new RuntimeException("RuleSet version not found: " + version));
        activateRuleSet(ruleSet);
    }

    @Transactional
    public void deactivateRuleSet(Long id) {
        RuleSet ruleSet = ruleSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RuleSet not found"));
        if (ruleSet.isActive()) {
            ruleSet.setActive(false);
            ruleSetRepository.save(ruleSet);
            this.kieContainer = null;
            this.activeRuleSet = null;
        }
    }

    @Transactional
    public void deleteRuleSet(Long id) {
        RuleSet ruleSet = ruleSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RuleSet not found"));
        if (ruleSet.isActive()) {
            throw new RuntimeException("Cannot delete an active ruleset");
        }
        ruleSetRepository.delete(ruleSet);
    }

    @Transactional
    public RuleSet uploadAndOptionallyActivate(String drlContent, String fileName, String version, boolean activate) {
        // Check version uniqueness
        if (version != null && ruleSetRepository.findByVersion(version).isPresent()) {
            throw new IllegalArgumentException("Version " + version + " already exists");
        }

        RuleSet ruleSet = new RuleSet();
        ruleSet.setDrlContent(drlContent);
        ruleSet.setName(fileName);
        ruleSet.setVersion(version != null ? version : Instant.now().toString());
        ruleSet.setCreatedAt(Instant.now());
        ruleSet.setActive(false);

        ruleSet = ruleSetRepository.save(ruleSet);

        if (activate) {
            activateRuleSet(ruleSet);
        }
        return ruleSet;
    }

    public void validateRules(String drlContent, String versionHint) {
        RuleSet previousRuleSet = this.activeRuleSet;
        KieContainer previousContainer = this.kieContainer;
        RuleSet probe = new RuleSet();
        probe.setVersion(versionHint != null ? versionHint : "validation");
        probe.setDrlContent(drlContent);
        compileAndSetContainer(probe);
        this.activeRuleSet = previousRuleSet;
        this.kieContainer = previousContainer;
    }

    public PriceEvaluationResponse evaluatePrice(PriceEvaluationRequest request) {
        if (kieContainer == null) {
            log.warn("Pricing evaluation requested without an active ruleset. Falling back to base pricing.");
            return buildFallbackResponse(request, FALLBACK_RULE_VERSION);
        }

        KieSession kieSession = kieContainer.newKieSession();
        try {
            List<PriceEvaluationResponse.BreakdownItem> breakdown = new ArrayList<>();
            kieSession.setGlobal("breakdown", breakdown);

            kieSession.insert(request);
            kieSession.fireAllRules();

            PriceEvaluationResponse response = new PriceEvaluationResponse();
            response.setFinalPrice(request.getFinalPrice() != null ? request.getFinalPrice() : calculateBaseSubtotal(request));
            response.setCurrency(request.getCurrency());
            response.setActiveRuleVersion(activeRuleSet != null ? activeRuleSet.getVersion() : "unknown");
            response.setEvaluatedAt(Instant.now().toString());
            response.setBreakdown(breakdown);
            return response;
        } catch (Exception e) {
            log.error("Failed to evaluate pricing with active ruleset. Falling back to base pricing.", e);
            return buildFallbackResponse(request, "fallback-evaluation-error");
        } finally {
            kieSession.dispose();
        }
    }

    private void bootstrapDefaultRuleset() {
        String defaultDrl = loadBundledRuleset();
        if (defaultDrl == null || defaultDrl.isBlank()) {
            log.error("Bundled default pricing rules were not found. Price evaluation will use fallback subtotal mode.");
            return;
        }

        try {
            RuleSet defaultRuleSet = ruleSetRepository.findByVersion(DEFAULT_RULESET_VERSION)
                    .map(existing -> refreshDefaultRuleContent(existing, defaultDrl))
                    .orElseGet(() -> createDefaultRuleSet(defaultDrl));

            compileAndSetContainer(defaultRuleSet);
            setAsActive(defaultRuleSet);
            log.info("Bootstrapped default pricing ruleset version {}", defaultRuleSet.getVersion());
        } catch (Exception e) {
            log.error("Failed to bootstrap default pricing ruleset. Price evaluation will use fallback subtotal mode.", e);
            this.kieContainer = null;
            this.activeRuleSet = null;
        }
    }

    private RuleSet refreshDefaultRuleContent(RuleSet existing, String defaultDrl) {
        if (!defaultDrl.equals(existing.getDrlContent())) {
            existing.setDrlContent(defaultDrl);
        }
        if (existing.getName() == null || existing.getName().isBlank()) {
            existing.setName(DEFAULT_RULESET_NAME);
        }
        if (existing.getCreatedAt() == null) {
            existing.setCreatedAt(Instant.now());
        }
        return ruleSetRepository.save(existing);
    }

    private RuleSet createDefaultRuleSet(String defaultDrl) {
        RuleSet ruleSet = new RuleSet();
        ruleSet.setVersion(DEFAULT_RULESET_VERSION);
        ruleSet.setName(DEFAULT_RULESET_NAME);
        ruleSet.setDrlContent(defaultDrl);
        ruleSet.setCreatedAt(Instant.now());
        ruleSet.setActive(false);
        return ruleSetRepository.save(ruleSet);
    }

    private void setAsActive(RuleSet targetRuleSet) {
        ruleSetRepository.findByActiveTrue().ifPresent(current -> {
            if (!current.getId().equals(targetRuleSet.getId())) {
                current.setActive(false);
                current.setActivatedAt(null);
                ruleSetRepository.save(current);
            }
        });
        targetRuleSet.setActive(true);
        targetRuleSet.setActivatedAt(Instant.now());
        ruleSetRepository.save(targetRuleSet);
        this.activeRuleSet = targetRuleSet;
    }

    private String loadBundledRuleset() {
        try (InputStream inputStream = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream(DEFAULT_RULESET_RESOURCE)) {
            if (inputStream == null) {
                return null;
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Unable to read bundled ruleset {}", DEFAULT_RULESET_RESOURCE, e);
            return null;
        }
    }

    private PriceEvaluationResponse buildFallbackResponse(PriceEvaluationRequest request, String fallbackVersion) {
        List<PriceEvaluationResponse.BreakdownItem> breakdown = new ArrayList<>();
        PriceEvaluationResponse.BreakdownItem item = new PriceEvaluationResponse.BreakdownItem();
        item.setRuleName("Fallback base pricing");
        item.setDescription("No active rules available. Using base price multiplied by seat count.");
        item.setAppliedValue(request.getSeatCount() != null ? request.getSeatCount() : 1);
        breakdown.add(item);

        PriceEvaluationResponse response = new PriceEvaluationResponse();
        response.setFinalPrice(calculateBaseSubtotal(request));
        response.setCurrency(request.getCurrency());
        response.setActiveRuleVersion(fallbackVersion);
        response.setEvaluatedAt(Instant.now().toString());
        response.setBreakdown(breakdown);
        return response;
    }

    private long calculateBaseSubtotal(PriceEvaluationRequest request) {
        long basePrice = request.getBasePrice() != null ? request.getBasePrice() : 0L;
        int seatCount = (request.getSeatCount() != null && request.getSeatCount() > 0) ? request.getSeatCount() : 1;
        return Math.max(basePrice, 0L) * seatCount;
    }
}
