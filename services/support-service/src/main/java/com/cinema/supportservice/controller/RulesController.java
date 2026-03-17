package com.cinema.supportservice.controller;

import com.cinema.supportservice.dto.PriceEvaluationRequest;
import com.cinema.supportservice.dto.PriceEvaluationResponse;
import com.cinema.supportservice.model.RuleSet;
import com.cinema.supportservice.repository.RuleSetRepository;
import com.cinema.supportservice.service.RulesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
public class RulesController {

    private final RuleSetRepository ruleSetRepository;
    private final RulesService rulesService;

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<RuleSet> uploadRuleset(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "version", required = false) String version,
            @RequestParam(value = "activate", defaultValue = "false") boolean activate) throws IOException {

        String drlContent = new String(file.getBytes(), StandardCharsets.UTF_8);
        RuleSet ruleSet = rulesService.uploadAndOptionallyActivate(
                drlContent,
                file.getOriginalFilename(),
                version,
                activate
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ruleSet);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public Page<RuleSet> listRulesets(Pageable pageable) {
        return ruleSetRepository.findAll(pageable);
    }

    @GetMapping("/active")
    public ResponseEntity<RuleSet> getActiveRuleset() {
        return ruleSetRepository.findByActiveTrue()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{ruleId}/activate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Void> activateRuleset(@PathVariable Long ruleId) {
        RuleSet ruleSet = ruleSetRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("RuleSet not found"));
        rulesService.activateRuleSet(ruleSet);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/evaluate/price")
    public ResponseEntity<PriceEvaluationResponse> evaluatePrice(@RequestBody PriceEvaluationRequest request) {
        PriceEvaluationResponse response = rulesService.evaluatePrice(request);
        return ResponseEntity.ok(response);
    }
}