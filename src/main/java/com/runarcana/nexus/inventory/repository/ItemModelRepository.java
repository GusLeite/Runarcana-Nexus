package com.runarcana.nexus.inventory.repository;

import com.runarcana.nexus.inventory.entity.ItemModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemModelRepository extends JpaRepository<ItemModel, Long> {
}
