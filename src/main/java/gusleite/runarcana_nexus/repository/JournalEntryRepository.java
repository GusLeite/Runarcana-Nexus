package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.journal.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findTop300ByOrderByCreatedAtDescIdDesc();
}
