package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.AccountResponse;
import gusleite.runarcana_nexus.record.ChangePasswordRequest;
import gusleite.runarcana_nexus.record.CreatePlayerRequest;
import gusleite.runarcana_nexus.record.PlayerAccountResponse;
import gusleite.runarcana_nexus.record.PlayerResponse;
import gusleite.runarcana_nexus.record.LoginRequest;
import gusleite.runarcana_nexus.record.LoginResponse;
import gusleite.runarcana_nexus.record.TemporaryPasswordResponse;
import gusleite.runarcana_nexus.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ResponseEntity.ok(service.login(request, http.getRemoteAddr()));
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(AccountResponse.of(service.authenticate(authorization)));
    }

    // Entrar como o personagem de teste do mestre.
    @PostMapping("/test-player")
    public ResponseEntity<LoginResponse> testPlayer(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(service.loginAsTestPlayer(authorization));
    }

    // Jogadores adicionados pelo mestre (a tela de seleção os junta aos da mesa).
    @GetMapping("/players")
    public ResponseEntity<List<PlayerResponse>> players() {
        return ResponseEntity.ok(service.customPlayers());
    }

    @PostMapping("/players")
    public ResponseEntity<TemporaryPasswordResponse> createPlayer(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody CreatePlayerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createPlayer(authorization, request));
    }

    // Mestre: contas de jogador e se ainda usam a senha provisória.
    @GetMapping("/accounts")
    public ResponseEntity<List<PlayerAccountResponse>> accounts(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(service.playerAccounts(authorization));
    }

    // Mestre: gera uma senha provisória para o jogador (primeiro acesso ou senha esquecida).
    @PostMapping("/accounts/{username}/reset-password")
    public ResponseEntity<TemporaryPasswordResponse> resetPassword(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String username) {
        return ResponseEntity.ok(service.resetPassword(authorization, username));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        service.logout(authorization);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password")
    public ResponseEntity<AccountResponse> changePassword(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(service.changePassword(authorization, request));
    }
}
