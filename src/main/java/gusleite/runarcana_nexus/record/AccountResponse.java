package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.model.auth.Account;

public record AccountResponse(
    String username,
    boolean mustChangePassword
) {
    public static AccountResponse of(Account account) {
        return new AccountResponse(account.getUsername(), account.isMustChangePassword());
    }
}
