package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.LevelUpPreview;
import gusleite.runarcana_nexus.record.LevelUpRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.LevelUpService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Subida de nível: o mestre libera os níveis; o jogador escolhe o que ganha e aplica na própria ficha.
// A prévia não salva; a aplicação atualiza a ficha.
@RestController
@RequestMapping("/character")
public class LevelUpController {

    private final LevelUpService levelUp;
    private final AuthService auth;

    public LevelUpController(LevelUpService levelUp, AuthService auth) {
        this.levelUp = levelUp;
        this.auth = auth;
    }

    // Mestre: quantos níveis a ficha pode subir (0 cancela).
    @PatchMapping("/{characterId}/pending-levels")
    public ResponseEntity<CharacterResponse> setPending(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @RequestBody PendingLevelsRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(levelUp.setPending(characterId, request.pendingLevels()));
    }

    public record PendingLevelsRequest(int pendingLevels) {}

    @PostMapping("/me/level-up/preview")
    public ResponseEntity<LevelUpPreview> preview(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody LevelUpRequest request) {
        return ResponseEntity.ok(levelUp.preview(auth.authenticate(authorization), request));
    }

    @PostMapping("/me/level-up")
    public ResponseEntity<CharacterResponse> apply(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody LevelUpRequest request) {
        return ResponseEntity.ok(levelUp.apply(auth.authenticate(authorization), request));
    }
}
