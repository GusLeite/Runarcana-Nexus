package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.LiveHub;
import gusleite.runarcana_nexus.services.LiveTickets;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

// Canal ao vivo: POST /live/ticket (com o Bearer) e depois GET /live/stream?ticket=… (Server-Sent Events).
@RestController
@RequestMapping("/live")
public class LiveController {

    private final AuthService auth;
    private final LiveTickets tickets;
    private final LiveHub hub;

    public LiveController(AuthService auth, LiveTickets tickets, LiveHub hub) {
        this.auth = auth;
        this.tickets = tickets;
        this.hub = hub;
    }

    @PostMapping("/ticket")
    public Map<String, String> ticket(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return Map.of("ticket", tickets.issue(auth.authenticate(authorization).getUsername()));
    }

    // Sem "produces": com ele, o 401 de ticket inválido viraria 406 (o JSON de erro não casa com text/event-stream).
    @GetMapping("/stream")
    public SseEmitter stream(@RequestParam(required = false) String ticket) {
        tickets.redeem(ticket);
        return hub.open();
    }
}
