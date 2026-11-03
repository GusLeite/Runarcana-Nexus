package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.map.MapWaypoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapWaypointRepository extends JpaRepository<MapWaypoint, Long> {
    List<MapWaypoint> findByOwnerOrderById(Account owner);

    long countByOwner(Account owner);
}
