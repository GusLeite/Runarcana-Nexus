package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.WorkbenchService;
import gusleite.runarcana_nexus.services.WorkbenchService.CraftRequest;
import gusleite.runarcana_nexus.services.WorkbenchService.CraftResult;
import gusleite.runarcana_nexus.services.WorkbenchService.Workbench;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

// Bancada de fabricação do jogador: as fórmulas que a ficha sabe fazer e a fabricação (teste rolado no servidor).
@RestController
public class WorkbenchController {

    private final WorkbenchService workbench;
    private final AuthService auth;

    public WorkbenchController(WorkbenchService workbench, AuthService auth) {
        this.workbench = workbench;
        this.auth = auth;
    }

    @GetMapping("/character/me/workbench")
    public ResponseEntity<Workbench> of(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(workbench.of(auth.authenticate(authorization)));
    }

    @PostMapping("/character/me/workbench/craft")
    public ResponseEntity<CraftResult> craft(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                             @RequestBody CraftRequest request) {
        return ResponseEntity.ok(workbench.craft(auth.authenticate(authorization), request));
    }
}
