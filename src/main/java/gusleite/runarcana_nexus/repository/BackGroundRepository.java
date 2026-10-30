package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BackGroundRepository extends JpaRepository<Background,Long> {

    public Background findByName(String name);

    Optional<Background> findByNameIgnoreCase(String name);
}
