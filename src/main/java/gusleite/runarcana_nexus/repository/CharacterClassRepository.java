package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterClassRepository extends JpaRepository<CharacterClass,Long> {
}
