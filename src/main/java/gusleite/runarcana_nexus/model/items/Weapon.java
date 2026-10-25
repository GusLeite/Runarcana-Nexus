package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.*;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class Weapon extends Item {
    @Enumerated(EnumType.STRING)
    private Attribute damageAttribute;
    @Enumerated(EnumType.STRING)
    private DamageType damageType;
    private Integer hitDice;
    private Integer hitDiceQuantity;
    private Integer critical;
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<WeaponMasteryType> masteries = new HashSet<>();;
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<WeaponProperty> properties = new HashSet<>();
    @Enumerated(EnumType.STRING)
    private WeaponCategory category;
    @Enumerated(EnumType.STRING)
    private WeaponType weaponType;

}
