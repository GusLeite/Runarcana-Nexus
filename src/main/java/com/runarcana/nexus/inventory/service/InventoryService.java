package com.runarcana.nexus.inventory.service;

import com.runarcana.nexus.inventory.dto.CharacterInventoryResponse;
import com.runarcana.nexus.inventory.dto.InventoryEntryRequest;
import com.runarcana.nexus.inventory.dto.InventoryEntryResponse;
import com.runarcana.nexus.inventory.entity.InventoryEntry;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import com.runarcana.nexus.inventory.exception.ResourceNotFoundException;
import com.runarcana.nexus.inventory.mapper.InventoryMapper;
import com.runarcana.nexus.inventory.repository.InventoryEntryRepository;
import com.runarcana.nexus.inventory.repository.ItemModelRepository;
import com.runarcana.nexus.inventory.repository.PlayerCharacterRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final PlayerCharacterRepository characterRepository;
    private final ItemModelRepository itemModelRepository;
    private final InventoryEntryRepository inventoryEntryRepository;
    private final InventoryMapper mapper;

    public InventoryService(PlayerCharacterRepository characterRepository,
                            ItemModelRepository itemModelRepository,
                            InventoryEntryRepository inventoryEntryRepository,
                            InventoryMapper mapper) {
        this.characterRepository = characterRepository;
        this.itemModelRepository = itemModelRepository;
        this.inventoryEntryRepository = inventoryEntryRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public CharacterInventoryResponse getInventory(Long characterId) {
        PlayerCharacter character = getCharacter(characterId);
        List<InventoryEntryResponse> entries = inventoryEntryRepository.findByCharacterId(characterId)
                .stream()
                .map(mapper::toEntryResponse)
                .toList();
        return new CharacterInventoryResponse(character.getId(), character.getName(), entries);
    }

    @Transactional
    public InventoryEntryResponse addItem(Long characterId, InventoryEntryRequest request) {
        PlayerCharacter character = getCharacter(characterId);
        ItemModel itemModel = getItem(request.itemModelId());

        InventoryEntry entry = inventoryEntryRepository.findByCharacterIdAndItemModelId(characterId, request.itemModelId())
                .orElseGet(() -> {
                    InventoryEntry newEntry = new InventoryEntry();
                    newEntry.setCharacter(character);
                    newEntry.setItemModel(itemModel);
                    newEntry.setQuantity(0);
                    return newEntry;
                });

        entry.setQuantity(entry.getQuantity() + request.quantity());
        InventoryEntry saved = inventoryEntryRepository.save(entry);
        return mapper.toEntryResponse(saved);
    }

    @Transactional
    public InventoryEntryResponse updateQuantity(Long characterId, Long entryId, Integer quantity) {
        getCharacter(characterId);
        InventoryEntry entry = inventoryEntryRepository.findByCharacterIdAndId(characterId, entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory entry not found: " + entryId));
        entry.setQuantity(quantity);
        return mapper.toEntryResponse(inventoryEntryRepository.save(entry));
    }

    @Transactional
    public void removeEntry(Long characterId, Long entryId) {
        getCharacter(characterId);
        InventoryEntry entry = inventoryEntryRepository.findByCharacterIdAndId(characterId, entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory entry not found: " + entryId));
        inventoryEntryRepository.delete(entry);
    }

    private PlayerCharacter getCharacter(Long characterId) {
        return characterRepository.findById(characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found: " + characterId));
    }

    private ItemModel getItem(Long itemModelId) {
        return itemModelRepository.findById(itemModelId)
                .orElseThrow(() -> new ResourceNotFoundException("Item model not found: " + itemModelId));
    }
}
