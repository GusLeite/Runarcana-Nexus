package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.lore.LoreEntry;
import gusleite.runarcana_nexus.model.map.MapPoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MapPoiRepository extends JpaRepository<MapPoi, Long> {
    List<MapPoi> findByLoreEntry(LoreEntry entry);

    // [id, quantidade de imagens]: a lista de pontos não carrega as imagens, só conta.
    @Query("select p.id, size(p.images) from MapPoi p")
    List<Object[]> countImages();
}
