package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CharacterClassRepository extends JpaRepository<CharacterClass,Long> {

    Optional<CharacterClass> findByClassName(CharacterClassType className);
}
