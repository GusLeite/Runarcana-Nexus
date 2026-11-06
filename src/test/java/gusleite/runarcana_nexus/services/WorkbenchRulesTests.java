package gusleite.runarcana_nexus.services;

import org.junit.jupiter.api.Test;

import static gusleite.runarcana_nexus.services.WorkbenchService.Outcome.*;
import static org.assertj.core.api.Assertions.assertThat;

// Regras da bancada: resultado do teste, custo dos materiais e leitura de CD/valor do formulas.json.
class WorkbenchRulesTests {

    @Test
    void resultadoDoTeste() {
        assertThat(WorkbenchService.outcome(20, 21, 30, 20)).isEqualTo(MASTERWORK);
        assertThat(WorkbenchService.outcome(19, 25, 15, 19)).isEqualTo(MASTERWORK); // margem de Obra-Prima maior
        assertThat(WorkbenchService.outcome(19, 25, 15, 20)).isEqualTo(SUCCESS);
        assertThat(WorkbenchService.outcome(10, 15, 15, 20)).isEqualTo(SUCCESS);
        assertThat(WorkbenchService.outcome(10, 14, 15, 20)).isEqualTo(FAILED);
        assertThat(WorkbenchService.outcome(6, 10, 15, 20)).isEqualTo(RUINED);
        assertThat(WorkbenchService.outcome(1, 30, 15, 20)).isEqualTo(RUINED);
    }

    @Test
    void materiaisSaoMetadeDoValorParaCima() {
        assertThat(WorkbenchService.materials(25)).isEqualTo(13);
        assertThat(WorkbenchService.materials(2)).isEqualTo(1);
        assertThat(WorkbenchService.materials(0)).isEqualTo(0);
    }

    @Test
    void leCdEValor() {
        assertThat(WorkbenchService.numbers("13")).containsExactly(13);
        assertThat(WorkbenchService.numbers("13, 15, 17")).containsExactly(13, 15, 17);
        assertThat(WorkbenchService.numbers("*")).isEmpty();
        assertThat(WorkbenchService.values("25 PO")).containsExactly(25);
        assertThat(WorkbenchService.values("50 PO (10 doses)")).containsExactly(50);
        assertThat(WorkbenchService.values("15, 35, 60 PO")).containsExactly(15, 35, 60);
        assertThat(WorkbenchService.values("10.000.000 PO")).containsExactly(10_000_000);
        assertThat(WorkbenchService.values("10.000 PO")).containsExactly(10000);
        assertThat(WorkbenchService.values("35 PO+")).containsExactly(35);
        assertThat(WorkbenchService.values("5 PP")).containsExactly(1);
        assertThat(WorkbenchService.values("25 PP")).containsExactly(3);
        assertThat(WorkbenchService.values("8 PC")).containsExactly(1);
        assertThat(WorkbenchService.values("Variável")).isEmpty();
        assertThat(WorkbenchService.values("*")).isEmpty();
    }

    @Test
    void formulaGeralCitaOOficio() {
        assertThat(WorkbenchService.mentions("Chaveiro, joalheiro, artesanato (carpinteiro)", "Joalheiro")).isTrue();
        assertThat(WorkbenchService.mentions("Armadureiro, Cuteleiro", "Apotecário")).isFalse();
        assertThat(WorkbenchService.mentions("Apotecario e Alquimista", "Apotecário")).isTrue();
    }
}
