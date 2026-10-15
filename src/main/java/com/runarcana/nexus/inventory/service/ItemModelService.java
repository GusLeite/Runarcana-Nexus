package com.runarcana.nexus.inventory.service;

import com.runarcana.nexus.inventory.dto.ItemModelRequest;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.exception.ConflictException;
import com.runarcana.nexus.inventory.exception.ResourceNotFoundException;
import com.runarcana.nexus.inventory.repository.ItemModelRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemModelService {

    private final ItemModelRepository itemModelRepository;

    public ItemModelService(ItemModelRepository itemModelRepository) {
        this.itemModelRepository = itemModelRepository;
    }

    @Transactional
    public ItemModel create(ItemModelRequest request) {
        ItemModel itemModel = new ItemModel();
        apply(itemModel, request);
        return itemModelRepository.save(itemModel);
    }

    @Transactional(readOnly = true)
    public List<ItemModel> list() {
        return itemModelRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ItemModel getById(Long id) {
        return itemModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item model not found: " + id));
    }

    @Transactional
    public ItemModel update(Long id, ItemModelRequest request) {
        ItemModel itemModel = getById(id);
        apply(itemModel, request);
        return itemModelRepository.save(itemModel);
    }

    @Transactional
    public void delete(Long id) {
        ItemModel itemModel = getById(id);
        try {
            itemModelRepository.delete(itemModel);
            itemModelRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Item model is referenced by inventory entries and cannot be deleted", ex);
        }
    }

    private void apply(ItemModel itemModel, ItemModelRequest request) {
        itemModel.setName(request.name().trim());
        itemModel.setDescription(request.description());
        itemModel.setItemType(request.itemType());
        itemModel.setWeight(request.weight());
        itemModel.setImageFileName(request.imageFileName());
    }
}
