package com.cinema.supportservice.config;

import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DroolsConfig {

    @Bean
    public KieServices kieServices() {
        return KieServices.Factory.get();
    }

    // Initially, we create an empty KieContainer. It will be replaced when rules are activated.
    @Bean
    public KieContainer kieContainer() {
        return kieServices().getKieClasspathContainer(); // loads rules from classpath, but we'll manage dynamically
    }
}