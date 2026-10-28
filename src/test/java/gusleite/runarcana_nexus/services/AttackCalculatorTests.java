package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.record.AttackResponse;
import gusleite.runarcana_nexus.rules.RuleItems;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;
import java.util.Map;
import java.util.function.ToIntFunction;

import static org.assertj.core.api.Assertions.assertThat;

// Ataques com arma sobre o rules/itens.json real.
class AttackCalculatorTests {

    private static RuleItems items;
    // FOR +1, DES +3; proficiência +2.
    private static final ToIntFunction<Attribute> MODS = a -> Map.of(Attribute.STRENGTH, 1, Attribute.DEXTERITY, 3).getOrDefault(a, 0);

    @BeforeAll
    static void load() {
        items = new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json", "classpath:rules/herancas.json",
                "classpath:rules/tracos.json", "classpath:rules/recursos.json", "classpath:rules/magias.json", "classpath:rules/itens.json", "classpath:rules/aprimoramentos.json").catalog().equipment();
    }

    private static AttackResponse attack(String id, List<String> proficiencies) {
        var weapon = AttackCalculator.fromCatalog("ITEM:1", EquipmentRules.item(items, id).orElseThrow());
        return AttackCalculator.calculate(MODS, 2, proficiencies, List.of(weapon)).getFirst();
    }

    @Test
    void acuidadeUsaODeMaiorModificador() {
        AttackResponse adaga = attack("adaga", List.of("Armas simples"));
        assertThat(adaga.attribute()).isEqualTo(Attribute.DEXTERITY);
        assertThat(adaga.proficient()).isTrue();
        assertThat(adaga.attackBonus()).isEqualTo(5);
        assertThat(adaga.damage()).isEqualTo("1d4+3");
        assertThat(adaga.damageType()).isEqualTo(DamageType.P);
        assertThat(adaga.critRange()).isEqualTo(19);
        assertThat(adaga.critMultiplier()).isEqualTo(3);
        assertThat(adaga.range()).isEqualTo("20/60 pés");
    }

    @Test
    void semProficienciaNaoSomaOBonus() {
        AttackResponse espada = attack("espada-longa", List.of("Armas simples"));
        assertThat(espada.attribute()).isEqualTo(Attribute.STRENGTH);
        assertThat(espada.proficient()).isFalse();
        assertThat(espada.attackBonus()).isEqualTo(1);
        assertThat(espada.versatileDamage()).startsWith("1d10");
    }

    @Test
    void proficienciaPeloNomeNoPlural() {
        assertThat(attack("espada-longa", List.of("Espadas longas")).proficient()).isTrue();
        assertThat(attack("espada-longa", List.of("Armas marciais")).attackBonus()).isEqualTo(3);
    }

    @Test
    void armaADistanciaUsaDestreza() {
        AttackResponse arco = attack("arco-curto", List.of("Armas simples"));
        assertThat(arco.attribute()).isEqualTo(Attribute.DEXTERITY);
        assertThat(arco.attackBonus()).isEqualTo(5);
        assertThat(arco.range()).isNotNull();
    }

    @Test
    void ataqueDesarmadoSempreNoFim() {
        List<AttackResponse> attacks = AttackCalculator.calculate(MODS, 2, List.of(), List.of());
        assertThat(attacks).singleElement().satisfies(a -> {
            assertThat(a.key()).isEqualTo(AttackCalculator.UNARMED);
            assertThat(a.attackBonus()).isEqualTo(3);
            assertThat(a.damage()).isEqualTo("2");
        });
    }

    @Test
    void criticoPadraoEMultiplicador() {
        assertThat(AttackCalculator.critical("x2")).containsExactly(20, 2);
        assertThat(AttackCalculator.critical("18 x4")).containsExactly(18, 4);
        assertThat(AttackCalculator.critical(null)).containsExactly(20, 2);
    }
}
