package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Limita as senhas erradas por endereço, em memória: basta para uma instância só e zera ao reiniciar.
@Component
public class LoginThrottle {

    private static final Duration WINDOW = Duration.ofMinutes(15);

    private record Failures(int count, Instant expiresAt) {}

    private final Map<String, Failures> failures = new ConcurrentHashMap<>();
    private final int maxAttempts;

    public LoginThrottle(@Value("${runarcana.auth.login-max-attempts:10}") int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public void check(String address) {
        Instant now = Instant.now();
        failures.values().removeIf(f -> f.expiresAt().isBefore(now));
        Failures current = failures.get(address);
        if (current != null && current.count() >= maxAttempts) {
            throw ApiException.tooManyRequests("Muitas tentativas de login. Tente de novo em alguns minutos.");
        }
    }

    public void recordFailure(String address) {
        failures.merge(address, new Failures(1, Instant.now().plus(WINDOW)),
                (old, next) -> new Failures(old.count() + 1, next.expiresAt()));
    }

    public void recordSuccess(String address) {
        failures.remove(address);
    }
}
