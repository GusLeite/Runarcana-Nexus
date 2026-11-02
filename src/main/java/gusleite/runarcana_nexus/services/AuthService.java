package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.AccountRole;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.record.CreatePlayerRequest;
import gusleite.runarcana_nexus.record.PlayerAccountResponse;
import gusleite.runarcana_nexus.record.PlayerResponse;
import gusleite.runarcana_nexus.record.TemporaryPasswordResponse;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.auth.AuthToken;
import gusleite.runarcana_nexus.record.ChangePasswordRequest;
import gusleite.runarcana_nexus.record.LoginRequest;
import gusleite.runarcana_nexus.record.LoginResponse;
import gusleite.runarcana_nexus.record.AccountResponse;
import gusleite.runarcana_nexus.repository.AccountRepository;
import gusleite.runarcana_nexus.repository.AuthTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

// Login por token opaco: o cliente recebe um token aleatório e o envia em "Authorization: Bearer <token>".
@Service
public class AuthService {

    // Conta de jogador reservada ao mestre, para testar a ficha como jogador.
    public static final String TEST_PLAYER = "teste";

    private static final Duration TOKEN_TTL = Duration.ofDays(30);
    private static final String INVALID_LOGIN = "Usuário ou senha incorretos.";
    private static final String INVALID_SESSION = "Sessão expirada. Entre novamente.";
    private static final String TEMPORARY_PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
    private static final int TEMPORARY_PASSWORD_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accounts;
    private final AuthTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final LoginThrottle throttle;
    private final boolean usernameAsPassword;

    public AuthService(AccountRepository accounts, AuthTokenRepository tokens, PasswordEncoder encoder, LoginThrottle throttle,
                       @Value("${runarcana.auth.username-as-initial-password:false}") boolean usernameAsPassword) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.encoder = encoder;
        this.throttle = throttle;
        this.usernameAsPassword = usernameAsPassword;
    }

    public static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    // Senha provisória fácil de ditar: sem caracteres que se confundem (0/O, 1/l/I).
    public static String newTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMPORARY_PASSWORD_LENGTH);
        for (int i = 0; i < TEMPORARY_PASSWORD_LENGTH; i++) {
            password.append(TEMPORARY_PASSWORD_CHARS.charAt(RANDOM.nextInt(TEMPORARY_PASSWORD_CHARS.length())));
        }
        return password.toString();
    }

    public LoginResponse login(LoginRequest request, String address) {
        throttle.check(address);
        Account account = accounts.findByUsername(normalizeUsername(request.username()))
                .filter(a -> encoder.matches(request.password(), a.getPasswordHash()))
                .orElse(null);
        if (account == null) {
            throttle.recordFailure(address);
            throw ApiException.unauthorized(INVALID_LOGIN);
        }
        throttle.recordSuccess(address);
        return openSession(account);
    }

    // Entra como o personagem de teste (só o mestre): sessão própria, sem trocar a do mestre.
    public LoginResponse loginAsTestPlayer(String authorization) {
        requireMaster(authorization);
        Account account = accounts.findByUsername(TEST_PLAYER)
                .orElseThrow(() -> ApiException.badRequest("A conta de teste não existe."));
        return openSession(account);
    }

    // Jogadores que aparecem na tela de seleção além dos da mesa original (os que o mestre adicionou).
    public List<PlayerResponse> customPlayers() {
        return accounts.findAll().stream()
                .filter(a -> a.isCustom() && !a.isMaster())
                .sorted(Comparator.comparing(Account::getId))
                .map(a -> new PlayerResponse(a.getUsername()))
                .toList();
    }

    // Mestre: as contas de jogador (sem a do mestre e a de teste).
    public List<PlayerAccountResponse> playerAccounts(String authorization) {
        requireMaster(authorization);
        return accounts.findAll().stream()
                .filter(a -> !a.isMaster() && !a.getUsername().equals(TEST_PLAYER))
                .sorted(Comparator.comparing(Account::getId))
                .map(a -> new PlayerAccountResponse(a.getUsername(), a.isMustChangePassword()))
                .toList();
    }

    // Mestre: senha provisória nova para o jogador, que a troca no próximo acesso; as sessões dele caem.
    @Transactional
    public TemporaryPasswordResponse resetPassword(String authorization, String username) {
        requireMaster(authorization);
        Account account = accounts.findByUsername(normalizeUsername(username))
                .filter(a -> !a.isMaster() && !a.getUsername().equals(TEST_PLAYER))
                .orElseThrow(() -> ApiException.notFound("Jogador não encontrado."));
        String password = newTemporaryPassword();
        account.setPasswordHash(encoder.encode(password));
        account.setMustChangePassword(true);
        accounts.save(account);
        tokens.deleteByAccount(account);
        return new TemporaryPasswordResponse(account.getUsername(), password);
    }

    public TemporaryPasswordResponse createPlayer(String authorization, CreatePlayerRequest request) {
        requireMaster(authorization);
        String username = normalizeUsername(request.username());
        if (!username.matches("[a-z0-9_-]{2,20}")) {
            throw ApiException.badRequest("Use de 2 a 20 letras minúsculas, números, - ou _ no nome do jogador.");
        }
        if (username.equals(TEST_PLAYER) || accounts.existsByUsername(username)) {
            throw ApiException.badRequest("Já existe um jogador com esse nome.");
        }
        Account account = new Account();
        account.setUsername(username);
        String password = usernameAsPassword ? username : newTemporaryPassword();
        account.setPasswordHash(encoder.encode(password));
        account.setMustChangePassword(true);
        account.setRole(AccountRole.PLAYER);
        account.setCustom(true);
        accounts.save(account);
        return new TemporaryPasswordResponse(username, password);
    }

    private LoginResponse openSession(Account account) {
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

    // Como authenticate, mas só deixa passar a conta do mestre (403 para jogadores).
    public Account requireMaster(String authorization) {
        Account account = authenticate(authorization);
        if (!account.isMaster()) {
            throw ApiException.forbidden("Só o mestre pode fazer isso.");
        }
        return account;
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
        RANDOM.nextBytes(bytes);
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
