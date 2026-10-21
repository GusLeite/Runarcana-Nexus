package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.enums.WeaponMasteryType;
import gusleite.runarcana_nexus.enums.WeaponProperty;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.Set;

@Entity
public class Weapon extends Item {
    private Attribute damageAttribute;
    private DamageType damageType;
    private Integer hitDice;
    private Integer hitDiceQuantity;
    private Integer critical;
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<WeaponMasteryType> masteries;
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<WeaponProperty> properties;
}
