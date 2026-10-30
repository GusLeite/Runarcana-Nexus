package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Uma forma temporária (Forma de Sho'Ma, Forma Dracônica) ou um efeito ativo (Fúria, Iras, Sutras...) da ficha, com os
// números já calculados na criação/subida. Em texto curto, lido por Character e CharacterService:
// attributes "STRENGTH:2,DEXTERITY:4" (P = metade da proficiência), speeds "WALK:50.0,FLY:40.0", size "UP"/"LARGE",
// resistances/immunities "cortante,perfurante", damage "ATTACK:MELEE|+1d4" (alvo|bônus, separados por ";").
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CharacterForm {
    private String name;
    @Column(length = 4000)
    private String description;
    private String attributes;
    private String speeds;
    private String size;
    // FORM (uma por vez) ou EFFECT (vários ao mesmo tempo).
    private String kind;
    private Double speedBonus;
    private Integer ac;
    @Column(length = 1000)
    private String resistances;
    @Column(length = 1000)
    private String immunities;
    @Column(length = 1000)
    private String damage;
    // RD e bônus na iniciativa dos efeitos (Totem do Carneiro Vulcânico, do Basilisco).
    private Integer reduction;
    private Integer initiative;

    public CharacterForm(String name, String description, String attributes, String speeds, String size) {
        this(name, description, attributes, speeds, size, "FORM", null, null, null, null, null, null, null);
    }

    public boolean isEffect() {
        return "EFFECT".equals(kind);
    }
}
