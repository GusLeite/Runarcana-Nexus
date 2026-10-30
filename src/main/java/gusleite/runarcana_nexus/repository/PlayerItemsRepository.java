package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerItemsRepository extends JpaRepository<PlayerItems, Long> {

    List<PlayerItems> findByCharacterOrderByIdAsc(Character character);

    Optional<PlayerItems> findFirstByCharacterAndItem(Character character, Item item);
}
