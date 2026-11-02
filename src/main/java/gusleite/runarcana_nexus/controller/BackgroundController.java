package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.BackGroundSkillsRequest;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.BackgroundService;
import gusleite.runarcana_nexus.services.CharacterClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Só o mestre: rotas antigas, de antes do assistente de criação.
@RestController
@RequestMapping("/background")
public class BackgroundController {
    @Autowired
    private BackgroundService service;

    @Autowired
    private AuthService authService;


    @PostMapping
    public ResponseEntity<Background> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Background request) {
        authService.requireMaster(authorization);

        Background created = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<List<Background>> getAll(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization){
        authService.requireMaster(authorization);
        return  ResponseEntity.ok(service.getAllClasses());
    }

    @PatchMapping("/{name}")
    public ResponseEntity<Background> getbyName(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String name,@RequestBody BackGroundSkillsRequest request){
        authService.requireMaster(authorization);
        return  ResponseEntity.ok(service.getBackGroundByName(name,request));
    }
}
