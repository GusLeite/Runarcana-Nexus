package com.runarcana.nexus.inventory.controller;

import com.runarcana.nexus.inventory.dto.ItemModelRequest;
import com.runarcana.nexus.inventory.dto.ItemModelResponse;
import com.runarcana.nexus.inventory.mapper.InventoryMapper;
import com.runarcana.nexus.inventory.service.ItemModelService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/items")
public class ItemModelController {

    private final ItemModelService itemModelService;
    private final InventoryMapper mapper;

    public ItemModelController(ItemModelService itemModelService, InventoryMapper mapper) {
        this.itemModelService = itemModelService;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ItemModelResponse> create(@Valid @RequestBody ItemModelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toItemResponse(itemModelService.create(request)));
    }

    @GetMapping
    public List<ItemModelResponse> list() {
        return itemModelService.list().stream().map(mapper::toItemResponse).toList();
    }

    @GetMapping("/{id}")
    public ItemModelResponse getById(@PathVariable Long id) {
        return mapper.toItemResponse(itemModelService.getById(id));
    }

    @PutMapping("/{id}")
    public ItemModelResponse update(@PathVariable Long id, @Valid @RequestBody ItemModelRequest request) {
        return mapper.toItemResponse(itemModelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemModelService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
