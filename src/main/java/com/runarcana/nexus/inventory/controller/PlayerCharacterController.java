package com.runarcana.nexus.inventory.controller;

import com.runarcana.nexus.inventory.dto.CharacterInventoryResponse;
import com.runarcana.nexus.inventory.dto.InventoryEntryRequest;
import com.runarcana.nexus.inventory.dto.InventoryEntryResponse;
import com.runarcana.nexus.inventory.dto.InventoryQuantityUpdateRequest;
import com.runarcana.nexus.inventory.dto.PlayerCharacterRequest;
import com.runarcana.nexus.inventory.dto.PlayerCharacterResponse;
import com.runarcana.nexus.inventory.mapper.InventoryMapper;
import com.runarcana.nexus.inventory.service.InventoryService;
import com.runarcana.nexus.inventory.service.PlayerCharacterService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/characters")
public class PlayerCharacterController {

    private final PlayerCharacterService playerCharacterService;
    private final InventoryService inventoryService;
    private final InventoryMapper mapper;

    public PlayerCharacterController(PlayerCharacterService playerCharacterService,
                                     InventoryService inventoryService,
                                     InventoryMapper mapper) {
        this.playerCharacterService = playerCharacterService;
        this.inventoryService = inventoryService;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<PlayerCharacterResponse> create(@Valid @RequestBody PlayerCharacterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toCharacterResponse(playerCharacterService.create(request)));
    }

    @GetMapping
    public List<PlayerCharacterResponse> list() {
        return playerCharacterService.list().stream().map(mapper::toCharacterResponse).toList();
    }

    @GetMapping("/{id}")
    public PlayerCharacterResponse getById(@PathVariable Long id) {
        return mapper.toCharacterResponse(playerCharacterService.getById(id));
    }

    @GetMapping("/{id}/inventory")
    public CharacterInventoryResponse getInventory(@PathVariable Long id) {
        return inventoryService.getInventory(id);
    }

    @PostMapping("/{id}/inventory")
    public ResponseEntity<InventoryEntryResponse> addToInventory(@PathVariable Long id,
                                                                 @Valid @RequestBody InventoryEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.addItem(id, request));
    }

    @PatchMapping("/{id}/inventory/{entryId}")
    public InventoryEntryResponse updateQuantity(@PathVariable Long id,
                                                 @PathVariable Long entryId,
                                                 @Valid @RequestBody InventoryQuantityUpdateRequest request) {
        return inventoryService.updateQuantity(id, entryId, request.quantity());
    }

    @DeleteMapping("/{id}/inventory/{entryId}")
    public ResponseEntity<Void> deleteInventoryEntry(@PathVariable Long id, @PathVariable Long entryId) {
        inventoryService.removeEntry(id, entryId);
        return ResponseEntity.noContent().build();
    }
}
