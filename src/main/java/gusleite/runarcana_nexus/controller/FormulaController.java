package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.rules.RuleFormulas;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.FormulaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Fórmulas de Ofício: o catálogo (qualquer conta logada) e as conhecidas de uma ficha (só o mestre marca).
@RestController
public class FormulaController {

    private final FormulaService formulas;
    private final AuthService auth;

    public FormulaController(FormulaService formulas, AuthService auth) {
        this.formulas = formulas;
        this.auth = auth;
    }

    @GetMapping("/crafts/formulas")
    public ResponseEntity<RuleFormulas> catalog(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(formulas.catalog());
    }

    @PutMapping("/character/{id}/formulas")
    public ResponseEntity<CharacterResponse> setKnown(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable long id,
            @RequestBody FormulasRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(formulas.setKnown(id, request.formulas()));
    }

    public record FormulasRequest(List<String> formulas) {}
}
