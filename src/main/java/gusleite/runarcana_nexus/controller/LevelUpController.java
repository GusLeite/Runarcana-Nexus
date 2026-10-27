package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.LevelUpPreview;
import gusleite.runarcana_nexus.record.LevelUpRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CreationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Subida de nível: só o mestre. A prévia não salva; a aplicação atualiza a ficha.
@RestController
@RequestMapping("/character/{characterId}/level-up")
public class LevelUpController {

    private final CreationService creation;
    private final AuthService auth;

    public LevelUpController(CreationService creation, AuthService auth) {
        this.creation = creation;
        this.auth = auth;
    }

    @PostMapping("/preview")
    public ResponseEntity<LevelUpPreview> preview(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @RequestBody LevelUpRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(creation.levelUpPreview(characterId, request));
    }

    @PostMapping
    public ResponseEntity<CharacterResponse> apply(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long characterId,
            @RequestBody LevelUpRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(creation.levelUp(characterId, request));
    }
}
