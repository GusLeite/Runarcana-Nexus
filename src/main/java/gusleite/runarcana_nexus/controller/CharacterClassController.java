package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.services.CharacterClassService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/character-classes")
public class CharacterClassController {

    private final CharacterClassService service;

    public CharacterClassController(CharacterClassService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CharacterClass> create(
            @RequestBody CharacterClassRequest request) {

        CharacterClass created = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<List<CharacterClass>> getAll(){
        return  ResponseEntity.ok(service.getAllClasses());
    }
}