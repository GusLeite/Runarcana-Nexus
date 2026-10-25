package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.player.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CharacterRepository extends JpaRepository<Character,Long> {

    Optional<Character> findFirstByCharacterNameIgnoreCaseOrderByIdAsc(String characterName);
}
