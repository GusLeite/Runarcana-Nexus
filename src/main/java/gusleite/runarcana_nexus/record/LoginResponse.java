package gusleite.runarcana_nexus.record;

import java.time.Instant;

public record LoginResponse(
    String token,
    Instant expiresAt,
    AccountResponse account
) {}
