package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.lore.LoreEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoreEntryRepository extends JpaRepository<LoreEntry, Long> {
    List<LoreEntry> findByRegion(LoreEntry region);
}
