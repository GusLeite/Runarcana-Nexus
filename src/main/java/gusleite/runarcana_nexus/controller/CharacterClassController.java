package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.CharacterClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Só o mestre: rotas antigas, de antes do assistente de criação.
@RestController
@RequestMapping("/character-classes")
public class CharacterClassController {
    @Autowired
    private CharacterClassService service;

    @Autowired
    private AuthService authService;



    @PostMapping
    public ResponseEntity<CharacterClass> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody CharacterClassRequest request) {
        authService.requireMaster(authorization);

        CharacterClass created = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<List<CharacterClass>> getAll(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization){
        authService.requireMaster(authorization);
        return  ResponseEntity.ok(service.getAllClasses());
    }
}
