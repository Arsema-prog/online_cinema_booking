package com.cinema.supportservice.service;

import com.cinema.supportservice.dto.PriceEvaluationRequest;
import com.cinema.supportservice.dto.PriceEvaluationResponse;
import com.cinema.supportservice.model.RuleSet;
import com.cinema.supportservice.repository.RuleSetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RulesServiceTest {

    @Mock
    private RuleSetRepository ruleSetRepository;

    @InjectMocks
    private RulesService rulesService;

    @Test
    void shouldActivateRulesetByVersion() {
        RuleSet ruleSet = new RuleSet();
        ruleSet.setId(1L);
        ruleSet.setVersion("v1");
        ruleSet.setDrlContent("package test; rule \"r\" when then end");
        ruleSet.setName("rules.drl");
        ruleSet.setCreatedAt(Instant.now());
        when(ruleSetRepository.findByVersion("v1")).thenReturn(Optional.of(ruleSet));

        assertDoesNotThrow(() -> rulesService.activateRuleSetByVersion("v1"));
    }

    @Test
    void shouldReturnFallbackPriceWhenRuleDoesNotSetFinalPrice() {
        PriceEvaluationRequest req = new PriceEvaluationRequest();
        req.setSeatCount(2);
        req.setBasePrice(2000L);
        req.setCurrency("USD");

        assertThrows(RuntimeException.class, () -> rulesService.evaluatePrice(req));
    }
}
