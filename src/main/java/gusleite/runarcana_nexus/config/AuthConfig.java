package gusleite.runarcana_nexus.config;

import gusleite.runarcana_nexus.enums.AccountRole;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.repository.AccountRepository;
import gusleite.runarcana_nexus.services.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;
import java.util.function.UnaryOperator;

@Configuration
public class AuthConfig {

    private static final Logger log = LoggerFactory.getLogger(AuthConfig.class);

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Cria as contas dos personagens da mesa (e a do mestre) que ainda não existem, marcadas para trocar a senha.
    // Jogadores nascem com senha aleatória, que o mestre refaz no painel para entregar a eles.
    // O mestre usa runarcana.auth.master-password; sem ela, a senha aleatória sai uma vez no log.
    // Com username-as-initial-password (só testes e sandbox), a senha inicial é o nome do usuário.
    @Bean
    public ApplicationRunner seedAccounts(
            AccountRepository accounts,
            PasswordEncoder encoder,
            @Value("${runarcana.auth.seed-accounts:rudo,gaudron,proto,titan,loge}") List<String> usernames,
            @Value("${runarcana.auth.master-accounts:mestre}") List<String> masters,
            @Value("${runarcana.auth.master-password:}") String masterPassword,
            @Value("${runarcana.auth.username-as-initial-password:false}") boolean usernameAsPassword) {
        return args -> {
            seed(accounts, encoder, usernames, AccountRole.PLAYER,
                    username -> usernameAsPassword ? username : AuthService.newTemporaryPassword());
            seed(accounts, encoder, masters, AccountRole.MASTER, username -> {
                if (usernameAsPassword) return username;
                if (!masterPassword.isBlank()) return masterPassword;
                String generated = AuthService.newTemporaryPassword();
                log.warn("Senha inicial de '{}' (só aparece agora): {}", username, generated);
                return generated;
            });
            seedTestPlayer(accounts, encoder);
        };
    }

    // Conta do personagem de teste do mestre: nunca entra pelo login (senha aleatória), só pelo painel do mestre.
    private static void seedTestPlayer(AccountRepository accounts, PasswordEncoder encoder) {
        if (accounts.existsByUsername(AuthService.TEST_PLAYER)) return;
        Account account = new Account();
        account.setUsername(AuthService.TEST_PLAYER);
        account.setPasswordHash(encoder.encode(UUID.randomUUID().toString()));
        account.setRole(AccountRole.PLAYER);
        accounts.save(account);
        log.info("Conta do personagem de teste do mestre ('{}') criada.", AuthService.TEST_PLAYER);
    }

    private static void seed(AccountRepository accounts, PasswordEncoder encoder, List<String> usernames, AccountRole role,
                             UnaryOperator<String> initialPassword) {
        usernames.stream()
                .map(AuthService::normalizeUsername)
                .filter(username -> !username.isEmpty() && !accounts.existsByUsername(username))
                .forEach(username -> {
                    Account account = new Account();
                    account.setUsername(username);
                    account.setPasswordHash(encoder.encode(initialPassword.apply(username)));
                    account.setMustChangePassword(true);
                    account.setRole(role);
                    accounts.save(account);
                    log.info("Conta '{}' ({}) criada.", username, role);
                });
    }
}
