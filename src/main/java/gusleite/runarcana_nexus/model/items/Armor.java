package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Armor extends Item {
    // Tem o mesmo nome do peso em kg do Item; o getter gerado colidiria com Item.getWeight().
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @Enumerated(EnumType.STRING)
    private ArmorWeight weight;
    private int armorClass;
    @Enumerated(EnumType.STRING)
    private Attribute modifierAttribute;
    private Integer damageReduction;
    private boolean nerfStealth;

    public ArmorWeight getArmorWeight() {
        return weight;
    }

    public void setArmorWeight(ArmorWeight armorWeight) {
        this.weight = armorWeight;
    }
}
