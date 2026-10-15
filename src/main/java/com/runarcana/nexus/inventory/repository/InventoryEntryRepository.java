package com.runarcana.nexus.inventory.repository;

import com.runarcana.nexus.inventory.entity.InventoryEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryEntryRepository extends JpaRepository<InventoryEntry, Long> {

    @EntityGraph(attributePaths = "itemModel")
    List<InventoryEntry> findByCharacterId(Long characterId);

    Optional<InventoryEntry> findByCharacterIdAndId(Long characterId, Long id);

    Optional<InventoryEntry> findByCharacterIdAndItemModelId(Long characterId, Long itemModelId);
}
