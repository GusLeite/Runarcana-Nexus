package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.auth.AuthToken;
import gusleite.runarcana_nexus.record.ChangePasswordRequest;
import gusleite.runarcana_nexus.record.LoginRequest;
import gusleite.runarcana_nexus.record.LoginResponse;
import gusleite.runarcana_nexus.record.AccountResponse;
import gusleite.runarcana_nexus.repository.AccountRepository;
import gusleite.runarcana_nexus.repository.AuthTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

// Login por token opaco: o cliente recebe um token aleatório e o envia em "Authorization: Bearer <token>".
@Service
public class AuthService {

    private static final Duration TOKEN_TTL = Duration.ofDays(30);
    private static final String INVALID_LOGIN = "Usuário ou senha incorretos.";
    private static final String INVALID_SESSION = "Sessão expirada. Entre novamente.";

    private final AccountRepository accounts;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    public AuthService(AccountRepository accounts, AuthTokenRepository tokens, PasswordEncoder encoder) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.encoder = encoder;
    }

    public static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    public LoginResponse login(LoginRequest request) {
        Account account = accounts.findByUsername(normalizeUsername(request.username()))
                .filter(a -> encoder.matches(request.password(), a.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized(INVALID_LOGIN));

        tokens.deleteExpired(Instant.now());

        String token = newToken();
        AuthToken session = new AuthToken();
        session.setTokenHash(hash(token));
        session.setAccount(account);
        session.setExpiresAt(Instant.now().plus(TOKEN_TTL));
        tokens.save(session);

        return new LoginResponse(token, session.getExpiresAt(), AccountResponse.of(account));
    }

    // Resolve o header Authorization na conta logada, ou lança 401.
    public Account authenticate(String authorization) {
        String token = bearer(authorization);
        AuthToken session = tokens.findByTokenHash(hash(token))
                .orElseThrow(() -> ApiException.unauthorized(INVALID_SESSION));
        if (session.getExpiresAt().isBefore(Instant.now())) {
            tokens.delete(session);
            throw ApiException.unauthorized(INVALID_SESSION);
        }
        return session.getAccount();
    }

    public void logout(String authorization) {
        tokens.deleteByTokenHash(hash(bearer(authorization)));
    }

    public AccountResponse changePassword(String authorization, ChangePasswordRequest request) {
        Account account = authenticate(authorization);

        if (!encoder.matches(request.currentPassword(), account.getPasswordHash())) {
            throw ApiException.badRequest("A senha atual está incorreta.");
        }
        if (request.newPassword().equals(request.currentPassword())) {
            throw ApiException.badRequest("A nova senha precisa ser diferente da atual.");
        }
        if (normalizeUsername(request.newPassword()).equals(account.getUsername())) {
            throw ApiException.badRequest("A nova senha não pode ser o nome do personagem.");
        }

        account.setPasswordHash(encoder.encode(request.newPassword()));
        account.setMustChangePassword(false);
        account.setPasswordChangedAt(Instant.now());
        accounts.save(account);

        // Quem estava logado em outro aparelho precisa entrar de novo com a senha nova.
        tokens.deleteOthers(account, hash(bearer(authorization)));

        return AccountResponse.of(account);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String bearer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() <= 7) {
            throw ApiException.unauthorized(INVALID_SESSION);
        }
        return authorization.substring(7).trim();
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
