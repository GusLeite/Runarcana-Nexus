package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.*;
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
    @Enumerated(EnumType.STRING)
    private WeaponCategory category;
    @Enumerated(EnumType.STRING)
    private WeaponType weaponType;

}
