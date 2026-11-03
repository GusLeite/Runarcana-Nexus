package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.map.PartyTrailPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartyTrailPointRepository extends JpaRepository<PartyTrailPoint, Long> {

    List<PartyTrailPoint> findAllByOrderByIdAsc();

    Optional<PartyTrailPoint> findFirstByOrderByIdDesc();
}
