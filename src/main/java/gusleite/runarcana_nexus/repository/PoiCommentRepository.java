package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.map.MapPoi;
import gusleite.runarcana_nexus.model.map.PoiComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoiCommentRepository extends JpaRepository<PoiComment, Long> {
    List<PoiComment> findAllByOrderByCreatedAtAscIdAsc();

    void deleteByPoi(MapPoi poi);
}
