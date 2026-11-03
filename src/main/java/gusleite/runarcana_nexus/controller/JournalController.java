package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.JournalService;
import gusleite.runarcana_nexus.services.JournalService.JournalRequest;
import gusleite.runarcana_nexus.services.JournalService.JournalView;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Diário do grupo: qualquer conta logada lê e escreve; edita e apaga só o que é seu (o mestre, tudo).
@RestController
@RequestMapping("/journal")
public class JournalController {

    private final JournalService journal;
    private final AuthService auth;

    public JournalController(JournalService journal, AuthService auth) {
        this.journal = journal;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<JournalView>> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(journal.list(auth.authenticate(authorization)));
    }

    @PostMapping
    public ResponseEntity<JournalView> create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                              @RequestBody JournalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(journal.create(auth.authenticate(authorization), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalView> update(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                              @PathVariable Long id, @RequestBody JournalRequest request) {
        return ResponseEntity.ok(journal.update(auth.authenticate(authorization), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id) {
        journal.delete(auth.authenticate(authorization), id);
        return ResponseEntity.noContent().build();
    }
}
