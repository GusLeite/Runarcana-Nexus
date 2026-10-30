package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Efeito situacional de uma Herança ou Aprimoramento ("vantagem em Furtividade levemente obscurecido"), ligado ao que
// ele afeta na ficha. target: SKILL:<perícia>, SAVE (ou SAVE:<atributo>), INITIATIVE, AC, ATTACK (ou ATTACK:MELEE,
// RANGED, BOW, CROSSBOW, THROWN, FIREARM). source: "Herança: X", "Aprimoramento: Y".
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SituationalNote {
    private String target;
    @Column(length = 1000)
    private String note;
    private String source;
}
