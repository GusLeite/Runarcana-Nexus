package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CreationPreview;
import gusleite.runarcana_nexus.record.CreationRequest;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleMagic;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CreationService;
import gusleite.runarcana_nexus.services.RuleCatalogService;
import gusleite.runarcana_nexus.services.TableSettingsService;
import gusleite.runarcana_nexus.record.TableSettingsResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Assistente de criação de personagem: catálogo de regras, prévia da ficha e criação.
@RestController
@RequestMapping("/creation")
public class CreationController {

    private final CreationService creation;
    private final RuleCatalogService rules;
    private final AuthService auth;
    private final TableSettingsService settings;

    public CreationController(CreationService creation, RuleCatalogService rules, AuthService auth, TableSettingsService settings) {
        this.creation = creation;
        this.rules = rules;
        this.auth = auth;
        this.settings = settings;
    }

    @GetMapping("/catalog")
    public ResponseEntity<RuleCatalog> catalog(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(rules.catalog());
    }

    // Lista de magias do Capítulo 10 (fica fora do /catalog por ser grande).
    @GetMapping("/spells")
    public ResponseEntity<List<RuleMagic.Spell>> spells(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        RuleMagic magic = rules.catalog().magic();
        return ResponseEntity.ok(magic == null ? List.of() : magic.spellsOrEmpty());
    }

    // Configurações da mesa que valem na criação (ex.: modo de traços da Runinata travado pelo mestre).
    @GetMapping("/settings")
    public ResponseEntity<TableSettingsResponse> settings(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(settings.get());
    }

    // Só o mestre: trava (ou destrava, com null) o modo de traços da Runinata.
    @PutMapping("/settings")
    public ResponseEntity<TableSettingsResponse> updateSettings(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody TableSettingsResponse request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(settings.update(request.traitBudget()));
    }

    // Ficha em construção: não salva nada; errors diz o que falta para poder criar.
    @PostMapping("/preview")
    public ResponseEntity<CreationPreview> preview(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody CreationRequest request) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(creation.preview(request));
    }

    // Cria a ficha da conta logada (uma por conta). 400 com o primeiro erro da prévia; 409 se já existir.
    @PostMapping
    public ResponseEntity<CharacterResponse> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody CreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(creation.create(auth.authenticate(authorization), request));
    }
}
