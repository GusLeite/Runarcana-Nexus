package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.rules.RuleItems;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;

// Capítulo 6 com o rules/itens.json e o criacao.json reais: catálogo, opções de equipamento e riqueza inicial.
class EquipmentRulesTests {

    private static RuleCatalog catalog;
    private static RuleItems items;

    @BeforeAll
    static void load() {
        catalog = new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json", "classpath:rules/herancas.json",
                "classpath:rules/tracos.json", "classpath:rules/recursos.json", "classpath:rules/magias.json", "classpath:rules/itens.json").catalog();
        items = catalog.equipment();
    }

    @Test
    void catalogoComAsTabelasDoLivro() {
        assertThat(items.itemsOrEmpty()).hasSize(327);
        RuleItem placas = EquipmentRules.item(items, "armadura-placas").orElseThrow();
        assertThat(placas.armorClass()).isEqualTo(18);
        assertThat(placas.armorWeight()).isEqualTo("HEAVY");
        assertThat(placas.strength()).isEqualTo(15);
        assertThat(placas.priceCp()).isEqualTo(150_000);
        RuleItem espada = EquipmentRules.item(items, "espada-longa").orElseThrow();
        assertThat(espada.damage()).isEqualTo("1d8 r/ 1d6 p");
        assertThat(espada.groupsOrEmpty()).contains("arma-marcial", "arma-marcial-corpo-a-corpo");
        assertThat(EquipmentRules.item(items, "katana").orElseThrow().groupsOrEmpty()).contains("arma-bodisatva");
        assertThat(items.startingWealth()).containsEntry("BODHISATTVA", "5d4");
    }

    @Test
    void grupoViraUmaOpcaoPorItemComAsOutrasPartes() {
        List<String> options = EquipmentRules.expand(items, List.of("group:arma-marcial<=50+escudo-leve", "group:arma-marcial<=50*2"));
        assertThat(options).contains("espada-longa+escudo-leve", "espada-longa*2")
                // Balestra de Repetição custa 300 PO: fica de fora
                .noneMatch(o -> o.startsWith("balestra-de-repeticao"));
        assertThat(EquipmentRules.name(items, "besta-leve+virotes-de-besta")).isEqualTo("Besta Leve + Virotes de besta (20)");
        assertThat(EquipmentRules.name(items, "machadinha*2")).isEqualTo("Machadinha ×2");
        assertThat(EquipmentRules.problems(items, "group:arma-simples+group:arma-marcial")).isNotEmpty();
        assertThat(EquipmentRules.problems(items, "nao-existe")).isNotEmpty();
    }

    @Test
    void riquezaInicialRolaOsDadosDaClasse() {
        Random random = new Random(7);
        for (int i = 0; i < 50; i++) {
            assertThat(EquipmentRules.rollWealth("5d4 x 10", random)).isBetween(50, 200).matches(n -> n % 10 == 0);
            assertThat(EquipmentRules.rollWealth("5d4", random)).isBetween(5, 20);
        }
    }
}
