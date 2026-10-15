package com.runarcana.nexus.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "inventory_entries",
        uniqueConstraints = @UniqueConstraint(name = "uk_character_item", columnNames = {"character_id", "item_model_id"}),
        indexes = {
                @Index(name = "idx_inventory_character", columnList = "character_id"),
                @Index(name = "idx_inventory_item", columnList = "item_model_id")
        }
)
public class InventoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    private PlayerCharacter character;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_model_id", nullable = false)
    private ItemModel itemModel;

    @Column(nullable = false)
    private Integer quantity;

    public Long getId() {
        return id;
    }

    public PlayerCharacter getCharacter() {
        return character;
    }

    public void setCharacter(PlayerCharacter character) {
        this.character = character;
    }

    public ItemModel getItemModel() {
        return itemModel;
    }

    public void setItemModel(ItemModel itemModel) {
        this.itemModel = itemModel;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
