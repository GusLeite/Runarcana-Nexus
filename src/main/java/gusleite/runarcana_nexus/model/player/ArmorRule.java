package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.Attribute;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Regra de CA que veio da criação (concessões ARMOR_CLASS e AC_BONUS): uma opção de defesa (bonus = false)
// ou um bônus somado à opção usada (bonus = true). O cálculo fica em ArmorClassCalculator.
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class ArmorRule {
    // Nome mostrado: "Pele de Árvore", "Proteção Ajustável: Leve", "Escorregadio".
    @Column(name = "rule_name")
    private String name;
    private boolean bonus;
    // Opção: base + mod. de Destreza (limitado por dexMax) + mod. de attribute + proficiência. Bônus: amount (+ proficiência).
    private Integer base;
    private boolean dex;
    private Integer dexMax;
    @Enumerated(EnumType.STRING)
    @Column(name = "extra_attribute")
    private Attribute attribute;
    private boolean proficiency;
    private Integer amount;
    private Integer reduction;
    private boolean unarmoredOnly;
    private boolean blocksArmor;
}
