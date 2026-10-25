package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.enums.WeaponProperty;
import gusleite.runarcana_nexus.model.items.Armor;
import gusleite.runarcana_nexus.model.items.Consumable;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.items.Weapon;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import org.hibernate.Hibernate;

import java.util.List;

// Um item do inventário. Campos de arma/armadura vêm nulos nos outros tipos.
public record InventoryItemResponse(
        Long id,
        String name,
        String description,
        String effect,
        Rarity rarity,
        String kind,
        int quantity,
        Double weight,
        Integer price,
        String damage,
        DamageType damageType,
        List<WeaponProperty> properties,
        Integer armorClass,
        ArmorWeight armorWeight
) {
    public static InventoryItemResponse of(PlayerItems entry) {
        Item item = (Item) Hibernate.unproxy(entry.getItem());
        int quantity = entry.getQuantity() == null ? 1 : entry.getQuantity();

        String kind = "OBJECT";
        String damage = null;
        DamageType damageType = null;
        List<WeaponProperty> properties = null;
        Integer armorClass = null;
        ArmorWeight armorWeight = null;

        if (item instanceof Weapon weapon) {
            kind = "WEAPON";
            if (weapon.getHitDice() != null) {
                int dice = weapon.getHitDiceQuantity() == null ? 1 : weapon.getHitDiceQuantity();
                damage = dice + "d" + weapon.getHitDice();
            }
            damageType = weapon.getDamageType();
            properties = weapon.getProperties().stream().sorted().toList();
        } else if (item instanceof Armor armor) {
            kind = "ARMOR";
            armorClass = armor.getArmorClass();
            armorWeight = armor.getArmorWeight();
        } else if (item instanceof Consumable) {
            kind = "CONSUMABLE";
        }

        return new InventoryItemResponse(entry.getId(), item.getName(), item.getItemDescription(), item.getEffect(),
                item.getRarity(), kind, quantity, item.getWeight(), item.getPrice(),
                damage, damageType, properties, armorClass, armorWeight);
    }
}
