package com.runarcana.nexus.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.runarcana.nexus.inventory.dto.InventoryEntryRequest;
import com.runarcana.nexus.inventory.dto.InventoryEntryResponse;
import com.runarcana.nexus.inventory.entity.InventoryEntry;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.entity.ItemType;
import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import com.runarcana.nexus.inventory.mapper.InventoryMapper;
import com.runarcana.nexus.inventory.repository.InventoryEntryRepository;
import com.runarcana.nexus.inventory.repository.ItemModelRepository;
import com.runarcana.nexus.inventory.repository.PlayerCharacterRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private PlayerCharacterRepository playerCharacterRepository;
    @Mock
    private ItemModelRepository itemModelRepository;
    @Mock
    private InventoryEntryRepository inventoryEntryRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private final InventoryMapper mapper = new InventoryMapper();

    @Test
    void shouldMergeItemQuantityWhenEntryAlreadyExists() {
        InventoryService service = new InventoryService(playerCharacterRepository, itemModelRepository, inventoryEntryRepository, mapper);

        PlayerCharacter character = new PlayerCharacter();
        character.setName("Yasuo");

        ItemModel item = new ItemModel();
        item.setName("Elixir");
        item.setItemType(ItemType.CONSUMABLE);

        InventoryEntry existing = new InventoryEntry();
        existing.setCharacter(character);
        existing.setItemModel(item);
        existing.setQuantity(3);

        when(playerCharacterRepository.findById(1L)).thenReturn(Optional.of(character));
        when(itemModelRepository.findById(2L)).thenReturn(Optional.of(item));
        when(inventoryEntryRepository.findByCharacterIdAndItemModelId(1L, 2L)).thenReturn(Optional.of(existing));
        when(inventoryEntryRepository.save(any(InventoryEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryEntryResponse response = service.addItem(1L, new InventoryEntryRequest(2L, 5));

        assertThat(response.quantity()).isEqualTo(8);
        verify(inventoryEntryRepository).save(existing);
    }
}
