package gusleite.runarcana_nexus.model.lore;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Informação curta do verbete: "Regime: Império divino".
@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoreFact {
    @Column(name = "fact_label", length = 60)
    private String label;

    @Column(name = "fact_value", length = 120)
    private String value;
}
