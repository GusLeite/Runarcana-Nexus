package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.record.ArmorClassResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Armadura média com e sem o Aprimoramento Especialista em Armadura Média (DES +4).
class ArmorClassCalculatorTests {

    private static ArmorClassResponse with(boolean expert) {
        var meiaArmadura = new ArmorClassCalculator.ArmorItem("ITEM:1", "Meia-Armadura", 15, Attribute.DEXTERITY, ArmorWeight.MEDIUM, 1);
        return ArmorClassCalculator.calculate(a -> a == Attribute.DEXTERITY ? 4 : 0, 2, List.of(), List.of("MEDIUM"),
                List.of(meiaArmadura), "ITEM:1", List.of(), null, expert);
    }

    @Test
    void especialistaTiraOLimiteDeDestrezaESomaRd() {
        assertThat(with(false).value()).isEqualTo(17);
        assertThat(with(false).reduction()).isEqualTo(1);
        assertThat(with(true).value()).isEqualTo(19);
        assertThat(with(true).reduction()).isEqualTo(2);
    }
}
