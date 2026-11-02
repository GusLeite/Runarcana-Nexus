package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.rules.RuleCompendium;
import gusleite.runarcana_nexus.rules.RuleMagic;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CompendiumService;
import gusleite.runarcana_nexus.services.RuleCatalogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Consulta do livro para qualquer conta logada: páginas do compêndio (Familiares, Tecmaturgia e Aparatos) e os
// rituais e tabelas do Capítulo 10. As magias saem em GET /creation/spells.
@RestController
@RequestMapping("/compendium")
public class CompendiumController {

    private final CompendiumService compendium;
    private final RuleCatalogService rules;
    private final AuthService auth;

    public CompendiumController(CompendiumService compendium, RuleCatalogService rules, AuthService auth) {
        this.compendium = compendium;
        this.rules = rules;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<RuleCompendium> compendium(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(compendium.compendium());
    }

    // Rituais e tabelas do Capítulo 10 (Conjuração Ritual, Magia Púrpura...), sem precisar do catálogo inteiro.
    @GetMapping("/rituals")
    public ResponseEntity<MagicReference> rituals(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        RuleMagic magic = rules.catalog().magic();
        return ResponseEntity.ok(magic == null ? new MagicReference(List.of(), List.of())
                : new MagicReference(magic.ritualsOrEmpty(), magic.tablesOrEmpty()));
    }

    public record MagicReference(List<RuleMagic.Ritual> rituals, List<RuleMagic.Table> tables) {}
}
