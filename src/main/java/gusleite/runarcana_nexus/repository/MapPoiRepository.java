package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.lore.LoreEntry;
import gusleite.runarcana_nexus.model.map.MapPoi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapPoiRepository extends JpaRepository<MapPoi, Long> {
    List<MapPoi> findByLoreEntry(LoreEntry entry);
}
