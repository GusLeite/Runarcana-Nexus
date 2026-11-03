package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.repository.AccountRepository;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Transforma os nomes de usuário que o mestre escolheu nas contas de jogador.
@Component
public class RecipientResolver {

    private final AccountRepository accounts;

    public RecipientResolver(AccountRepository accounts) {
        this.accounts = accounts;
    }

    public Set<Account> resolve(List<String> usernames) {
        Set<Account> resolved = new HashSet<>();
        if (usernames == null) return resolved;
        for (String raw : usernames) {
            String username = AuthService.normalizeUsername(raw);
            if (username.isEmpty()) continue;
            resolved.add(accounts.findByUsername(username)
                    .filter(a -> !a.isMaster())
                    .orElseThrow(() -> ApiException.badRequest("Não existe jogador \"" + username + "\".")));
        }
        return resolved;
    }

    public static boolean reaches(Account account, boolean toAll, Set<Account> recipients) {
        return account.isMaster() || toAll || recipients.stream().anyMatch(a -> a.getId().equals(account.getId()));
    }

    public static List<String> names(Account viewer, Set<Account> recipients) {
        return viewer.isMaster() ? recipients.stream().map(Account::getUsername).sorted().toList() : null;
    }
}
