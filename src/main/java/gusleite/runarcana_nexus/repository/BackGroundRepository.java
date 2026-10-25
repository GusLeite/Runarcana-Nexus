package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BackGroundRepository extends JpaRepository<Background,Long> {

    public Background findByName(String name);
}
