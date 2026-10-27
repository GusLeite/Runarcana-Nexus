package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.HeritageCondition;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleLevel;
import gusleite.runarcana_nexus.rules.RuleLineage;
import gusleite.runarcana_nexus.rules.RuleOption;
import gusleite.runarcana_nexus.rules.RuleTrait;
import gusleite.runarcana_nexus.rules.RuleTraits;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

// A conferência do catálogo aponta onde está cada erro (é o que aparece ao subir o back com o JSON errado).
class RuleCatalogValidationTests {

    private static Grant grant(GrantType type, String value) {
        return new Grant(type, null, null, null, null, null, value, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void conferenciaDasHerancas() {
        RuleHeritage noRegion = new RuleHeritage("h1", "H1", HeritageCategory.REGION, null, null, List.of("tribo-x"), List.of("MAGO"), null, null,
                List.of("nao-existe"), List.of("tambem-nao"), null, 0, null, "texto",
                List.of(new HeritageCondition(null, List.of("tribo-y"), "sem-heranca", null, null, null)));
        RuleCatalog catalog = new RuleCatalog(new AttributeMethods(null, List.of(15, 14, 13, 12, 10, 8), null), 30.0, "DOWN",
                List.of(new RuleCatalog.Craft("x", "X", "GRANDE")), List.of(), List.of(), List.of(), List.of(), List.of(noRegion), null, null, null, null, null);

        List<String> problems = RuleCatalogService.validate(catalog);

        assertThat(problems).contains("herança h1: Herança de Região precisa de regions",
                "herança h1: classe desconhecida \"MAGO\"",
                "herança h1: excludes cita herança inexistente \"nao-existe\"",
                "herança h1: requires cita herança inexistente \"tambem-nao\"",
                "herança h1: anyOf cita linhagem desconhecida \"tribo-y\"",
                "herança h1: anyOf cita herança inexistente \"sem-heranca\"",
                "herança h1: maxTimes deve ser 1 ou mais",
                "herança h1: linhagem desconhecida \"tribo-x\"",
                "ofícios x: kind deve ser MAJOR ou MINOR");
    }

    @Test
    void apontaOsProblemasComOLugar() {
        RuleLineage lineage = new RuleLineage("lua", "Lua", null, List.of(),
                List.of(new RuleLevel(8, List.of(grant(GrantType.SKILL, null))), new RuleLevel(8, List.of())));
        RuleOption origin = new RuleOption("elfo", "Elfo", null, null, null, null, null, null,
                List.of(grant(GrantType.ATTRIBUTE, null), grant(GrantType.CRAFT, "pintura"), grant(GrantType.SIZE, "ENORME")), List.of(lineage), null,
                List.of(new RuleLevel(1, List.of())));
        RuleClass klass = new RuleClass("MAGO", "Mago", null, null, null, null, List.of(), List.of(), null, null, null);
        RuleCatalog catalog = new RuleCatalog(new AttributeMethods(null, List.of(15, 14, 13, 12, 10, 8), null), 30.0, "MEIO",
                List.of(), List.of(origin), List.of(klass), List.of(), List.of(), List.of(), null, null, null, null, null);

        List<String> problems = RuleCatalogService.validate(catalog);

        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 1 (ATTRIBUTE)"));
        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 2 (CRAFT)"));
        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, concessão 3 (SIZE)"));
        assertThat(problems).anyMatch(p -> p.startsWith("classe MAGO: id deve ser um destes"));
        assertThat(problems).anyMatch(p -> p.startsWith("classe MAGO: hitDie"));
        assertThat(problems).contains("rounding deve ser DOWN ou UP");
        // Ganhos por nível da origem e da linhagem
        assertThat(problems).contains("origens elfo: nível deve ir de 2 a 20",
                "origens elfo, linhagem lua: nível 8 repetido");
        assertThat(problems).anyMatch(p -> p.startsWith("origens elfo, linhagem lua nível 8, concessão 1 (SKILL)"));
    }

    @Test
    void conferenciaDosTracos() {
        RuleTrait noTier = new RuleTrait("t1", "T1", "ENORME", null, null, "texto", null, List.of("nao-existe"), null, null, null,
                List.of(grant(GrantType.SPEED, "NADAR")), null);
        RuleTrait noPoints = new RuleTrait("d1", "D1", null, "Forma", 0.0, "texto", null, null, null, null, null, null, null);
        RuleTraits traits = new RuleTraits(List.of(new RuleTraits.Budget("B", "Base", null, 1, null)), Map.of(),
                Map.of("MINOR", 1), List.of(noTier), List.of(noPoints));
        RuleOption runinata = new RuleOption("runinata", "Runinata", null, null, null, null, null, null, List.of(), null, true, null);
        RuleCatalog catalog = new RuleCatalog(new AttributeMethods(null, List.of(15, 14, 13, 12, 10, 8), null), 30.0, "DOWN",
                List.of(), List.of(runinata), List.of(), List.of(), List.of(), List.of(), traits, null, null, null, null);

        List<String> problems = RuleCatalogService.validate(catalog);

        assertThat(problems).contains("traços, modo B: minor e major devem ser 0 ou mais",
                "traços: costs precisa do custo de MAJOR",
                "traço t1: tier deve ser MINOR, MAJOR ou SUPERIOR",
                "traço t1: requires cita traço inexistente \"nao-existe\"",
                "desvantagem d1: points deve ser maior que 0");
        assertThat(problems).anyMatch(p -> p.startsWith("traço t1, concessão 1 (SPEED): value deve ser"));
    }

    @Test
    void oCatalogoRealSobeSemErros() {
        // Garante que o criacao.json, o herancas.json, o tracos.json, o recursos.json, o magias.json e o itens.json versionados continuam válidos a cada mudança.
        assertThatCode(() -> new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json",
                "classpath:rules/herancas.json", "classpath:rules/tracos.json", "classpath:rules/recursos.json",
                "classpath:rules/magias.json", "classpath:rules/itens.json", "classpath:rules/aprimoramentos.json"))
                .doesNotThrowAnyException();
    }
}
