package gusleite.runarcana_nexus.services;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import static org.assertj.core.api.Assertions.assertThat;

// O rules/formulas.json real sobe sem erros e acha as fórmulas pela chave "<ofício>:<fórmula>".
class FormulaServiceTests {

    @Test
    void catalogoRealSobeEAchaPelaChave() {
        FormulaService service = new FormulaService(new DefaultResourceLoader(), null, null, "classpath:rules/formulas.json");
        assertThat(service.catalog().generalOrEmpty()).hasSizeGreaterThan(50);
        assertThat(service.catalog().craftsOrEmpty()).containsKeys("cuteleiro", "alquimista", "artista");
        assertThat(service.find("cuteleiro:criar-arma-1")).get().satisfies(f -> {
            assertThat(f.name()).isEqualTo("Criar Arma");
            assertThat(f.dc()).isEqualTo("13");
        });
        assertThat(service.find("cuteleiro:nao-existe")).isEmpty();
    }
}
