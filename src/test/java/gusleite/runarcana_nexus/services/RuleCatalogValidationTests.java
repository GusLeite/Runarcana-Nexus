package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleOption;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

// A conferência do catálogo aponta onde está cada erro (é o que aparece ao subir o back com o JSON errado).
class RuleCatalogValidationTests {

    private static Grant grant(GrantType type, String value) {
        return new Grant(type, null, null, null, null, null, value, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null);
    }

    @Test
    void conferenciaDasHerancas() {
        RuleHeritage noRegion = new RuleHeritage("h1", "H1", HeritageCategory.REGION, null, null, List.of("tribo-x"), List.of("MAGO"), null, null,
                List.of("nao-existe"), null, 0, null, "texto");
        RuleCatalog catalog = new RuleCatalog(new AttributeMethods(null, List.of(15, 14, 13, 12, 10, 8), null), 30.0, "DOWN",
                List.of(new RuleCatalog.Craft("x", "X", "GRANDE")), List.of(), List.of(), List.of(), List.of(), List.of(noRegion));

        List<String> problems = RuleCatalogService.validate(catalog);

        assertThat(problems).contains("herança h1: Herança de Região precisa de regions",
                "herança h1: classe desconhecida \"MAGO\"",
                "herança h1: excludes cita herança inexistente \"nao-existe\"",
                "herança h1: maxTimes deve ser 1 ou mais",
                "herança h1: linhagem desconhecida \"tribo-x\"",
                "ofícios x: kind deve ser MAJOR ou MINOR");
    }

    @Test
    void apontaOsProblemasComOLugar() {
        RuleOption origin = new RuleOption("elfo", "Elfo", null, null, null, null, null, null,
                List.of(grant(GrantType.ATTRIBUTE, null), grant(GrantType.CRAFT, "pintura"), grant(GrantType.SIZE, "ENORME")), null);
        RuleClass klass = new RuleClass("MAGO", "Mago", null, null, null, null, List.of(), List.of());
        RuleCatalog catalog = new RuleCatalog(new AttributeMethods(null, List.of(15, 14, 13, 12, 10, 8), null), 30.0, "MEIO",
                List.of(), List.of(origin), List.of(klass), List.of(), List.of(), List.of());

        List<String> problems = RuleCatalogService.validate(catalog);

        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 1 (ATTRIBUTE)"));
        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 2 (CRAFT)"));
        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 3 (SIZE)"));
        assertThat(problems).anyMatch(p -> p.startsWith("classe MAGO: id deve ser um destes"));
        assertThat(problems).anyMatch(p -> p.startsWith("classe MAGO: hitDie"));
        assertThat(problems).contains("rounding deve ser DOWN ou UP");
    }

    @Test
    void oCatalogoRealSobeSemErros() {
        // Garante que o rules/criacao.json e o rules/herancas.json versionados continuam válidos a cada mudança.
        assertThatCode(() -> new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json",
                "classpath:rules/herancas.json"))
                .doesNotThrowAnyException();
    }
}
