package com.cinema.supportservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class PriceEvaluationResponse {
    private Long finalPrice;
    private String currency;
    private String activeRuleVersion;
    private String evaluatedAt;
    private List<BreakdownItem> breakdown;

    @Data
    public static class BreakdownItem {
        private String ruleName;
        private String description;
        private Object appliedValue;   // can be multiplier or discount amount
    }
}