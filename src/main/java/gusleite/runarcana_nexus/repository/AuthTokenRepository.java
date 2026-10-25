package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.auth.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByTokenHash(String tokenHash);

    @Transactional
    void deleteByTokenHash(String tokenHash);

    // Encerra as outras sessões da conta (usado ao trocar a senha).
    @Transactional
    @Modifying
    @Query("delete from AuthToken t where t.account = :account and t.tokenHash <> :keepHash")
    void deleteOthers(Account account, String keepHash);

    @Transactional
    @Modifying
    @Query("delete from AuthToken t where t.expiresAt < :now")
    void deleteExpired(Instant now);
}
