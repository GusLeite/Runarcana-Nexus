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
    void estilosDeLutaComOBonusJaSomado() {
        // FOR +1, DES +3, proficiência +2, 8º nível (+2 nos estilos).
        var espada = AttackCalculator.fromCatalog("ITEM:1", EquipmentRules.item(items, "espada-longa").orElseThrow());
        var arco = AttackCalculator.fromCatalog("ITEM:2", EquipmentRules.item(items, "arco-curto").orElseThrow());
        List<AttackResponse> attacks = AttackCalculator.calculate(MODS, 2, List.of("Armas marciais", "Armas simples"), List.of(espada, arco),
                java.util.Set.of("Duelismo", "Arquearia", "Combate com Armas Grandes", "Combate Desarmado"), 8);
        assertThat(attacks.get(0).styles()).extracting(AttackResponse.StyleVariant::name)
                .containsExactly("Combate com Armas Grandes", "Duelismo");
        // Duelismo: +2 no ataque e +4 no dano; Armas Grandes usa o dano versátil.
        assertThat(attacks.get(0).styles().get(1).attackBonus()).isEqualTo(5);
        assertThat(attacks.get(0).styles().get(1).damage()).isEqualTo("1d8+5");
        assertThat(attacks.get(0).styles().get(0).damage()).isEqualTo("1d10+3");
        // Arquearia: + metade da proficiência; arco de duas mãos não ganha Duelismo.
        assertThat(attacks.get(1).styles()).singleElement().satisfies(s -> assertThat(s.attackBonus()).isEqualTo(6));
        // Combate Desarmado: 1d4 + FOR.
        assertThat(attacks.get(2).styles().getFirst().damage()).isEqualTo("1d4+1");
    }

    @Test
    void criticoPadraoEMultiplicador() {
        assertThat(AttackCalculator.critical("x2")).containsExactly(20, 2);
        assertThat(AttackCalculator.critical("18 x4")).containsExactly(18, 4);
        assertThat(AttackCalculator.critical(null)).containsExactly(20, 2);
    }

    // Bônus de dano das Heranças: o fixo soma no modificador, o dado entra antes dele.
    @Test
    void somaBonusNoDano() {
        assertThat(AttackCalculator.addDamage("1d8+3", 2, List.of())).isEqualTo("1d8+5");
        assertThat(AttackCalculator.addDamage("1d8+3", 0, List.of("1d4"))).isEqualTo("1d8+1d4+3");
        assertThat(AttackCalculator.addDamage("1d6-1", 1, List.of())).isEqualTo("1d6");
        assertThat(AttackCalculator.addDamage(null, 2, List.of())).isNull();
    }
}
