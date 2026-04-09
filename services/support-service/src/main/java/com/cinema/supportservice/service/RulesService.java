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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RulesService {

    private final RuleSetRepository ruleSetRepository;
    private KieContainer kieContainer;
    private RuleSet activeRuleSet;

    @PostConstruct
    public void init() {
        ruleSetRepository.findByActiveTrue().ifPresent(ruleSet -> {
            compileAndSetContainer(ruleSet);
            this.activeRuleSet = ruleSet;
        });
    }

    private void compileAndSetContainer(RuleSet ruleSet) {
        try {
            KieServices kieServices = KieServices.Factory.get();
            KieFileSystem kieFileSystem = kieServices.newKieFileSystem();
            kieFileSystem.write("src/main/resources/" + ruleSet.getVersion() + ".drl", ruleSet.getDrlContent());

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
            throw new RuntimeException("No active ruleset");
        }

        KieSession kieSession = kieContainer.newKieSession();
        try {
            List<PriceEvaluationResponse.BreakdownItem> breakdown = new ArrayList<>();
            kieSession.setGlobal("breakdown", breakdown);

            kieSession.insert(request);
            kieSession.fireAllRules();

            PriceEvaluationResponse response = new PriceEvaluationResponse();
            response.setFinalPrice(request.getFinalPrice() != null ? request.getFinalPrice() : request.getBasePrice());
            response.setCurrency(request.getCurrency());
            response.setActiveRuleVersion(activeRuleSet != null ? activeRuleSet.getVersion() : "unknown");
            response.setEvaluatedAt(Instant.now().toString());
            response.setBreakdown(breakdown);
            return response;
        } finally {
            kieSession.dispose();
        }
    }
}