package gusleite.runarcana_nexus.services;

import org.junit.jupiter.api.Test;

import static gusleite.runarcana_nexus.enums.SkillType.DECEPTION;
import static gusleite.runarcana_nexus.enums.SkillType.PERSUASION;
import static org.assertj.core.api.Assertions.assertThat;

// Tabela da pechincha (MerchantService.haggleOutcome) e o preço resultante.
class HaggleRulesTests {

    @Test
    void persuasaoEhSeguraPerto() {
        assertThat(MerchantService.haggleOutcome(PERSUASION, 12, 25, 15)).isEqualTo(-20);
        assertThat(MerchantService.haggleOutcome(PERSUASION, 10, 15, 15)).isEqualTo(-10);
        assertThat(MerchantService.haggleOutcome(PERSUASION, 9, 11, 15)).isZero();
        assertThat(MerchantService.haggleOutcome(PERSUASION, 5, 10, 15)).isEqualTo(10);
        assertThat(MerchantService.haggleOutcome(PERSUASION, 2, 5, 15)).isEqualTo(20);
    }

    @Test
    void enganacaoRendeMaisMasQualquerFalhaIrrita() {
        assertThat(MerchantService.haggleOutcome(DECEPTION, 10, 15, 15)).isEqualTo(-15);
        assertThat(MerchantService.haggleOutcome(DECEPTION, 14, 26, 15)).isEqualTo(-25);
        assertThat(MerchantService.haggleOutcome(DECEPTION, 9, 14, 15)).isEqualTo(10);
        assertThat(MerchantService.haggleOutcome(DECEPTION, 3, 4, 15)).isEqualTo(25);
    }

    @Test
    void naturaisMandam() {
        assertThat(MerchantService.haggleOutcome(PERSUASION, 20, 21, 30)).isEqualTo(-20);
        assertThat(MerchantService.haggleOutcome(PERSUASION, 1, 16, 15)).isEqualTo(20);
    }

    @Test
    void precoArredondaParaCimaENuncaZera() {
        assertThat(MerchantService.haggled(10, -10)).isEqualTo(9);
        assertThat(MerchantService.haggled(10, 25)).isEqualTo(13);
        assertThat(MerchantService.haggled(1, -25)).isEqualTo(1);
        assertThat(MerchantService.haggled(0, 20)).isZero();
        assertThat(MerchantService.haggled(7, 0)).isEqualTo(7);
    }
}
