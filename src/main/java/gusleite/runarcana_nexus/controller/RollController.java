package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.RollService;
import gusleite.runarcana_nexus.services.RollService.RollRequest;
import gusleite.runarcana_nexus.services.RollService.RollView;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Rolagens da mesa: qualquer conta logada rola e vê o histórico (as secretas dos outros vêm sem os números).
@RestController
@RequestMapping("/rolls")
public class RollController {

    private final RollService rolls;
    private final AuthService auth;

    public RollController(RollService rolls, AuthService auth) {
        this.rolls = rolls;
        this.auth = auth;
    }

    @GetMapping
    public List<RollView> recent(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                 @RequestParam(required = false) Integer limit) {
        return rolls.recent(auth.authenticate(authorization), limit);
    }

    @PostMapping
    public ResponseEntity<RollView> roll(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                         @RequestBody RollRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rolls.roll(auth.authenticate(authorization), request));
    }
}
