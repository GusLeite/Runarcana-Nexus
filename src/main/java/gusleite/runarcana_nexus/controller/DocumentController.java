package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.DocumentRequest;
import gusleite.runarcana_nexus.record.DocumentResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService service;
    private final AuthService auth;

    public DocumentController(DocumentService service, AuthService auth) {
        this.service = service;
        this.auth = auth;
    }

    // Jogador: documentos que recebeu (para todos ou só para ele), com "read".
    @GetMapping("/me")
    public ResponseEntity<List<DocumentResponse>> mine(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(service.listFor(auth.authenticate(authorization)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long id) {
        service.markRead(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }

    // Mestre: todos os documentos, com os destinatários.
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> all(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/recipients")
    public ResponseEntity<List<String>> recipients(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(service.recipients());
    }

    @PostMapping
    public ResponseEntity<DocumentResponse> create(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(auth.requireMaster(authorization), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable Long id) {
        auth.requireMaster(authorization);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
