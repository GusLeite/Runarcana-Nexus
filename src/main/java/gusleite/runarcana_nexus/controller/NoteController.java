package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.NoteRequest;
import gusleite.runarcana_nexus.record.NoteResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Anotações do jogador logado.
@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteService service;
    private final AuthService auth;

    public NoteController(NoteService service, AuthService auth) {
        this.service = service;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<NoteResponse>> list(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(service.list(auth.authenticate(authorization)));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(auth.authenticate(authorization), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> update(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(service.update(auth.authenticate(authorization), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long id) {
        service.delete(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }
}
