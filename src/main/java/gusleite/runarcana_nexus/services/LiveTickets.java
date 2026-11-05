package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Ticket de uso único para abrir o canal ao vivo: o EventSource do navegador não manda o header Authorization,
// e o token de 30 dias não pode ir na URL (fica em log de proxy). O ticket vale poucos segundos e uma vez só.
@Service
public class LiveTickets {

    static final Duration TTL = Duration.ofSeconds(30);
    private static final SecureRandom RANDOM = new SecureRandom();

    private record Ticket(String username, Instant expiresAt) {
    }

    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();

    public String issue(String username) {
        Instant now = Instant.now();
        tickets.values().removeIf(t -> t.expiresAt().isBefore(now));
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        String ticket = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tickets.put(ticket, new Ticket(username, now.plus(TTL)));
        return ticket;
    }

    // Troca o ticket pela conta e o apaga; vencido, usado ou inventado dá 401.
    public String redeem(String ticket) {
        Ticket found = ticket == null ? null : tickets.remove(ticket);
        if (found == null || found.expiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Ticket do canal ao vivo inválido ou vencido.");
        }
        return found.username();
    }
}
