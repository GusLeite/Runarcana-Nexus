package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.map.MapRoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapRouteRepository extends JpaRepository<MapRoute, Long> {
    List<MapRoute> findByOwnerOrderById(Account owner);

    List<MapRoute> findAllByOrderById();

    long countByOwner(Account owner);
}
