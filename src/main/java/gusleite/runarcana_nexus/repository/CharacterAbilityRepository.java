package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CharacterAbilityRepository extends JpaRepository<CharacterAbility, Long> {

    List<CharacterAbility> findByCharacterOrderByIdAsc(Character character);

    Optional<CharacterAbility> findByIdAndCharacter(Long id, Character character);
}
