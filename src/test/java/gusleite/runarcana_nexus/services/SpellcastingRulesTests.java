package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.Grant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Nível máximo de magia lido das Conjurações do rules/criacao.json real.
class SpellcastingRulesTests {

    private static List<RuleClass> classes;

    @BeforeAll
    static void load() {
        classes = new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json", "classpath:rules/herancas.json",
                "classpath:rules/tracos.json", "classpath:rules/recursos.json", "classpath:rules/magias.json", "classpath:rules/itens.json", "classpath:rules/aprimoramentos.json").catalog().classes();
    }

    private static String conjuration(String classId) {
        return classes.stream().filter(k -> k.id().equals(classId)).findFirst().orElseThrow().grantsOrEmpty().stream()
                .filter(g -> "Conjuração".equals(g.name())).map(Grant::description).findFirst().orElseThrow();
    }

    @Test
    void acolitoPelaFrase() {
        String text = conjuration("ACOLYTE");
        assertThat(SpellcastingRules.maxSpellLevel(text, 1)).isEqualTo(1);
        assertThat(SpellcastingRules.maxSpellLevel(text, 4)).isEqualTo(2);
        assertThat(SpellcastingRules.maxSpellLevel(text, 17)).isEqualTo(9);
    }

    @Test
    void arcanistaEXamaPelaTabela() {
        assertThat(SpellcastingRules.maxSpellLevel(conjuration("ARCANIST"), 3)).isEqualTo(2);
        assertThat(SpellcastingRules.maxSpellLevel(conjuration("ARCANIST"), 20)).isEqualTo(9);
        assertThat(SpellcastingRules.maxSpellLevel(conjuration("SHAMAN"), 1)).isZero();
        assertThat(SpellcastingRules.maxSpellLevel(conjuration("SHAMAN"), 5)).isEqualTo(2);
    }
}
