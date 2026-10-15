package com.runarcana.nexus.inventory.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.runarcana.nexus.inventory.entity.InventoryEntry;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.entity.ItemType;
import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class InventoryEntryRepositoryTest {

    @Autowired
    private InventoryEntryRepository inventoryEntryRepository;

    @Autowired
    private PlayerCharacterRepository playerCharacterRepository;

    @Autowired
    private ItemModelRepository itemModelRepository;

    @Test
    void shouldFindEntryByCharacterAndItemModel() {
        PlayerCharacter character = new PlayerCharacter();
        character.setName("Ahri");
        character = playerCharacterRepository.save(character);

        ItemModel itemModel = new ItemModel();
        itemModel.setName("Poção");
        itemModel.setItemType(ItemType.CONSUMABLE);
        itemModel = itemModelRepository.save(itemModel);

        InventoryEntry entry = new InventoryEntry();
        entry.setCharacter(character);
        entry.setItemModel(itemModel);
        entry.setQuantity(2);
        inventoryEntryRepository.save(entry);

        assertThat(inventoryEntryRepository.findByCharacterIdAndItemModelId(character.getId(), itemModel.getId()))
                .isPresent();
    }
}
