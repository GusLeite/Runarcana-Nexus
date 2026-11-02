package gusleite.runarcana_nexus.model.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Configuração da mesa definida pelo mestre (chave → valor). Ex.: "runinata.traitBudget" = "MODERATE".
@Entity
@Getter
@Setter
@NoArgsConstructor
public class TableSetting {
    @Id
    @Column(name = "setting_key")
    private String key;

    @Column(name = "setting_value")
    private String value;

    public TableSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
