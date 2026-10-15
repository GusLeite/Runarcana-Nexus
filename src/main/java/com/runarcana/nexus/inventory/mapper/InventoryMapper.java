package com.runarcana.nexus.inventory.mapper;

import com.runarcana.nexus.inventory.dto.InventoryEntryResponse;
import com.runarcana.nexus.inventory.dto.ItemModelResponse;
import com.runarcana.nexus.inventory.dto.PlayerCharacterResponse;
import com.runarcana.nexus.inventory.entity.InventoryEntry;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    public ItemModelResponse toItemResponse(ItemModel itemModel) {
        return new ItemModelResponse(
                itemModel.getId(),
                itemModel.getName(),
                itemModel.getDescription(),
                itemModel.getItemType(),
                itemModel.getWeight(),
                itemModel.getImageFileName(),
                itemModel.getCreatedAt(),
                itemModel.getUpdatedAt()
        );
    }

    public PlayerCharacterResponse toCharacterResponse(PlayerCharacter character) {
        return new PlayerCharacterResponse(
                character.getId(),
                character.getName(),
                character.getCreatedAt(),
                character.getUpdatedAt()
        );
    }

    public InventoryEntryResponse toEntryResponse(InventoryEntry entry) {
        return new InventoryEntryResponse(
                entry.getId(),
                entry.getItemModel().getId(),
                entry.getItemModel().getName(),
                entry.getItemModel().getItemType(),
                entry.getItemModel().getWeight(),
                entry.getQuantity()
        );
    }
}
