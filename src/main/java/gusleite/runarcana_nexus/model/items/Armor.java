package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class Armor extends Item {
    @Enumerated(EnumType.STRING)
    private ArmorWeight weight;
    private int armorClass;
    private Attribute modifierAttribute;
    private Integer damageReduction;
    private boolean nerfStealth;
}
