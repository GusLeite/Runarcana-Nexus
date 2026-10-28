package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.rules.RuleConditions;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.ConditionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Condições do Capítulo 14 (nome e regra) e a Exaustão, para a ficha e o painel do mestre.
@RestController
@RequestMapping("/conditions")
public class ConditionController {

    private final ConditionService conditions;
    private final AuthService auth;

    public ConditionController(ConditionService conditions, AuthService auth) {
        this.conditions = conditions;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<RuleConditions> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(conditions.catalog());
    }
}
