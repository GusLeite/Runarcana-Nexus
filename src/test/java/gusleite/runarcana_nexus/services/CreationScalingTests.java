package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.UsesFormula;
import gusleite.runarcana_nexus.rules.Grant;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// Habilidades que escalam com o bônus de proficiência (ex.: "Inspirado" do Humano).
class CreationScalingTests {

    private static Grant inspired(UsesFormula formula) {
        return new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, "Inspirado", null, null, null, null,
                null, formula, Map.of("2", "1d4", "4", "1d6", "6", "1d8"), null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void metadeDaProficienciaArredondaConformeORegraEComMinimoDe1() {
        Grant g = inspired(UsesFormula.HALF_PROFICIENCY);
        assertThat(CreationService.usesFor(g, 2, false)).isEqualTo(1);
        assertThat(CreationService.usesFor(g, 3, false)).isEqualTo(1);
        assertThat(CreationService.usesFor(g, 3, true)).isEqualTo(2);
        assertThat(CreationService.usesFor(g, 6, false)).isEqualTo(3);
        assertThat(CreationService.usesFor(inspired(UsesFormula.PROFICIENCY), 4, false)).isEqualTo(4);
    }

    @Test
    void formulasDeUsosForaDoBonusSimples() {
        // Fúria Símia: dobro do bônus de proficiência.
        assertThat(CreationService.usesFor(inspired(UsesFormula.DOUBLE_PROFICIENCY), 3, false)).isEqualTo(6);
        // Autossacrifício: metade do nível (no 9º, 4 dados), mínimo 1 no 1º nível.
        Grant halfLevel = inspired(UsesFormula.HALF_LEVEL);
        assertThat(CreationService.usesFor(halfLevel, 4, 9, false, a -> 0)).isEqualTo(4);
        assertThat(CreationService.usesFor(halfLevel, 2, 1, false, a -> 0)).isEqualTo(1);
        // Plumadagas: 3 + bônus de proficiência.
        Grant plus = new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, "Plumadagas", null, null, null, null,
                null, UsesFormula.PROFICIENCY, null, null, null, null, null, null, null, null, null, null, null, 3, null, null, null, null);
        assertThat(CreationService.usesFor(plus, 2, false)).isEqualTo(5);
    }

    @Test
    void dadoSegueATabelaPeloMaiorBonusAtingido() {
        Grant g = inspired(UsesFormula.HALF_PROFICIENCY);
        assertThat(CreationService.diceFor(g, 2)).isEqualTo("1d4");
        assertThat(CreationService.diceFor(g, 3)).isEqualTo("1d4");
        assertThat(CreationService.diceFor(g, 5)).isEqualTo("1d6");
        assertThat(CreationService.diceFor(g, 6)).isEqualTo("1d8");
    }

    @Test
    void constituicaoPoderosaBateComOsExemplosDoLivro() {
        // Metade do bônus de proficiência por nível, para baixo: nível 1 = +1; até o nível 10 = +12.
        Grant g = new Grant(GrantType.HP_BONUS, null, null, null, null, null, null, null, null, null, null, null, null,
                null, UsesFormula.HALF_PROFICIENCY, null, null, null, null, null, null, true, null, null, null, null, null, null, null, null, null);
        assertThat(CreationService.hpBonusFor(g, 2, false)).isEqualTo(1);
        int total = 0;
        for (int level = 1; level <= 10; level++) total += CreationService.hpBonusFor(g, 2 + (level - 1) / 4, false);
        assertThat(total).isEqualTo(12);
    }

    @Test
    void danoSomaProficienciaEAtributo() {
        // Chifres do Minotauro: 1d6 + bônus de proficiência + mod. de Força.
        Grant horns = new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, "Chifres", null, null, null, "1d6",
                null, null, null, null, null, null, null, null, null, null, null, List.of("PROFICIENCY", "STRENGTH"), null, null, null, null, null, null);
        assertThat(CreationService.damageFor(horns, 2, false, a -> a == Attribute.STRENGTH ? 3 : 0)).isEqualTo("1d6+5");
        assertThat(CreationService.damageFor(horns, 2, false, a -> -3)).isEqualTo("1d6-1");
        assertThat(CreationService.damageFor(horns, 2, false, a -> -2)).isEqualTo("1d6");

        // Garras "de Força ou Destreza": vale o maior dos dois.
        Grant claws = new Grant(GrantType.FEATURE, null, null, null, null, null, null, null, "Garras", null, null, null, "1d6",
                null, null, null, null, null, null, null, null, null, null, null, List.of("PROFICIENCY", "STRENGTH_OR_DEXTERITY"), null, null, null, null, null, null);
        assertThat(CreationService.damageFor(claws, 2, false, a -> a == Attribute.STRENGTH ? 4 : 1)).isEqualTo("1d6+6");
        assertThat(CreationService.damageFor(claws, 2, false, a -> a == Attribute.DEXTERITY ? 3 : 0)).isEqualTo("1d6+5");
    }
}
