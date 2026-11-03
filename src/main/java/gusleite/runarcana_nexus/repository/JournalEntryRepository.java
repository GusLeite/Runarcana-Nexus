package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.journal.JournalEntry;
import gusleite.runarcana_nexus.model.map.MapPoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findTop300ByOrderByCreatedAtDescIdDesc();

    List<JournalEntry> findByPoiOrderByCreatedAtDescIdDesc(MapPoi poi);

    // Ao apagar o ponto, as entradas ficam no diário, só sem o local.
    @Modifying
    @Query("update JournalEntry e set e.poi = null where e.poi = :poi")
    void clearPoi(@Param("poi") MapPoi poi);
}
