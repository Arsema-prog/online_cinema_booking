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

    @PostConstruct
    public void init() {
        ruleSetRepository.findByActiveTrue().ifPresent(this::compileAndSetContainer);
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
            response.setFinalPrice(request.getFinalPrice());
            response.setCurrency(request.getCurrency());
            response.setBreakdown(breakdown);
            return response;
        } finally {
            kieSession.dispose();
        }
    }
}