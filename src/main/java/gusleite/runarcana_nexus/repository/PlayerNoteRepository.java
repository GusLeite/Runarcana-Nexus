package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.notes.PlayerNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerNoteRepository extends JpaRepository<PlayerNote, Long> {

    // Fixadas primeiro, depois as editadas mais recentemente.
    List<PlayerNote> findByAccountOrderByPinnedDescUpdatedAtDesc(Account account);

    Optional<PlayerNote> findByIdAndAccount(Long id, Account account);
}
