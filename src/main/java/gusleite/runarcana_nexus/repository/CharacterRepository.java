package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CharacterRepository extends JpaRepository<Character,Long> {

    Optional<Character> findFirstByAccountOrderByIdAsc(Account account);

    // Só fichas antigas, sem dono: uma ficha criada pelo assistente nunca é achada pelo nome.
    Optional<Character> findFirstByCharacterNameIgnoreCaseAndAccountIsNullOrderByIdAsc(String characterName);
}
