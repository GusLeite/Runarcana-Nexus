package gusleite.runarcana_nexus.config;

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

@Configuration
public class AuthConfig {

    private static final Logger log = LoggerFactory.getLogger(AuthConfig.class);

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Cria as contas dos personagens da mesa que ainda não existem.
    // A senha inicial é o próprio nome do usuário, e a conta fica marcada para trocar a senha.
    @Bean
    public ApplicationRunner seedAccounts(
            AccountRepository accounts,
            PasswordEncoder encoder,
            @Value("${runarcana.auth.seed-accounts:rudo,gaudron,proto,titan,loge}") List<String> usernames) {
        return args -> usernames.stream()
                .map(AuthService::normalizeUsername)
                .filter(username -> !username.isEmpty() && !accounts.existsByUsername(username))
                .forEach(username -> {
                    Account account = new Account();
                    account.setUsername(username);
                    account.setPasswordHash(encoder.encode(username));
                    account.setMustChangePassword(true);
                    accounts.save(account);
                    log.info("Conta criada para o personagem '{}' com a senha inicial padrão.", username);
                });
    }
}
