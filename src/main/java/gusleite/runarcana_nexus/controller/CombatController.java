package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CombatService;
import gusleite.runarcana_nexus.services.CombatService.AddRequest;
import gusleite.runarcana_nexus.services.CombatService.CombatantUpdate;
import gusleite.runarcana_nexus.services.CombatService.EncounterRequest;
import gusleite.runarcana_nexus.services.CombatService.EncounterView;
import gusleite.runarcana_nexus.services.CombatService.EnemyRequest;
import gusleite.runarcana_nexus.services.CombatService.EnemyView;
import gusleite.runarcana_nexus.services.CombatService.InitiativeRequest;
import gusleite.runarcana_nexus.services.CombatService.InitiativeResult;
import gusleite.runarcana_nexus.services.CombatService.PlayerRoll;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Combate. Mestre: /combat/enemies (bestiário) e /combat/encounters (montar, ativar, iniciativa, turnos, encerrar).
// Todos: /combat/active (o confronto ativo na visão de quem pede; 204 sem confronto) e o jogador rola a própria iniciativa.
@RestController
@RequestMapping("/combat")
public class CombatController {

    private final CombatService combat;
    private final AuthService auth;

    public CombatController(CombatService combat, AuthService auth) {
        this.combat = combat;
        this.auth = auth;
    }

    public record RenameRequest(String name) {}

    public record TurnRequest(Integer step) {}

    // ---------- Bestiário ----------

    @GetMapping("/enemies")
    public ResponseEntity<List<EnemyView>> enemies(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.enemies());
    }

    @PostMapping("/enemies")
    public ResponseEntity<EnemyView> createEnemy(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                 @RequestBody EnemyRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(combat.createEnemy(request));
    }

    @PutMapping("/enemies/{id}")
    public ResponseEntity<EnemyView> updateEnemy(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                 @PathVariable Long id, @RequestBody EnemyRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.updateEnemy(id, request));
    }

    @DeleteMapping("/enemies/{id}")
    public ResponseEntity<Void> deleteEnemy(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @PathVariable Long id) {
        auth.requireMaster(authorization);
        combat.deleteEnemy(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Confrontos ----------

    @GetMapping("/encounters")
    public ResponseEntity<List<EncounterView>> encounters(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.encounters());
    }

    @GetMapping("/encounters/{id}")
    public ResponseEntity<EncounterView> encounter(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                   @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.encounterView(id));
    }

    @PostMapping("/encounters")
    public ResponseEntity<EncounterView> create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @RequestBody EncounterRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(combat.create(request));
    }

    @PatchMapping("/encounters/{id}")
    public ResponseEntity<EncounterView> rename(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @PathVariable Long id, @RequestBody RenameRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.rename(id, request == null ? null : request.name()));
    }

    @DeleteMapping("/encounters/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id) {
        auth.requireMaster(authorization);
        combat.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/encounters/{id}/combatants")
    public ResponseEntity<EncounterView> add(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                             @PathVariable Long id, @RequestBody AddRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.add(id, request));
    }

    @PatchMapping("/encounters/{id}/combatants/{combatantId}")
    public ResponseEntity<EncounterView> update(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @PathVariable Long id, @PathVariable Long combatantId, @RequestBody CombatantUpdate request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.update(id, combatantId, request));
    }

    @DeleteMapping("/encounters/{id}/combatants/{combatantId}")
    public ResponseEntity<EncounterView> remove(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @PathVariable Long id, @PathVariable Long combatantId) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.remove(id, combatantId));
    }

    @PostMapping("/encounters/{id}/start")
    public ResponseEntity<EncounterView> start(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                               @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.start(id));
    }

    @PostMapping("/encounters/{id}/end")
    public ResponseEntity<EncounterView> end(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                             @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.end(id));
    }

    @PostMapping("/encounters/{id}/reset")
    public ResponseEntity<EncounterView> reset(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                               @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.reset(id));
    }

    @PostMapping("/encounters/{id}/initiative")
    public ResponseEntity<InitiativeResult> rollInitiative(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                           @PathVariable Long id, @RequestBody(required = false) InitiativeRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.rollInitiative(id, request));
    }

    @PostMapping("/encounters/{id}/turn")
    public ResponseEntity<EncounterView> turn(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                              @PathVariable Long id, @RequestBody(required = false) TurnRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(combat.turn(id, request == null || request.step() == null ? 1 : request.step()));
    }

    // ---------- Mesa ----------

    @GetMapping("/active")
    public ResponseEntity<EncounterView> active(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        EncounterView view = combat.active(auth.authenticate(authorization));
        return view == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(view);
    }

    @PostMapping("/active/initiative")
    public ResponseEntity<PlayerRoll> rollMine(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(combat.rollMine(auth.authenticate(authorization)));
    }
}
