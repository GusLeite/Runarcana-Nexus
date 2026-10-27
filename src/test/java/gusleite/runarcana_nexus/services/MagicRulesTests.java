package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleMagic;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// Capítulo 10 com o rules/magias.json real: custo de Mana e acesso aos elementos.
class MagicRulesTests {

    private static RuleMagic magic;

    @BeforeAll
    static void load() {
        magic = new RuleCatalogService(new DefaultResourceLoader(), "classpath:rules/criacao.json", "classpath:rules/herancas.json",
                "classpath:rules/tracos.json", "classpath:rules/recursos.json", "classpath:rules/magias.json", "classpath:rules/itens.json").catalog().magic();
    }

    private static Set<String> access(Set<String> manifested, Set<String> heritages) {
        return MagicRules.accessibleElements(magic, manifested, heritages, Set.of(), false);
    }

    @Test
    void custoDeManaPeloNivelDaMagia() {
        assertThat(MagicRules.manaCost(magic, 0)).isZero();
        assertThat(MagicRules.manaCost(magic, 3)).isEqualTo(5);
        assertThat(MagicRules.manaCost(magic, 9)).isEqualTo(21);
    }

    @Test
    void semElementoManifestoSoOsPrimarios() {
        assertThat(access(Set.of(), Set.of())).containsExactlyInAnyOrder("agua", "fogo", "terra", "vento");
    }

    @Test
    void secundariosTransicaoPrimordiaisETerciarios() {
        // Água abre Flora e Gelo.
        assertThat(access(Set.of("agua"), Set.of())).contains("flora", "gelo").doesNotContain("magma", "veneno", "sombrio");
        // Água + Fogo (opostos): Veneno, Inferno e Sombrio.
        assertThat(access(Set.of("agua", "fogo"), Set.of())).contains("veneno", "inferno", "sombrio").doesNotContain("luz", "som");
        // Os quatro primários: Luz.
        assertThat(access(Set.of("agua", "fogo", "terra", "vento"), Set.of())).contains("luz");
        // Herança Manifestação Primordial: Luz e Sombrio.
        assertThat(access(Set.of(), Set.of("manifestacao-primordial"))).contains("luz", "sombrio");
        // Terciário: os dois secundários.
        assertThat(access(Set.of("magma"), Set.of())).doesNotContain("metal");
        assertThat(access(Set.of("magma", "tempestade"), Set.of())).contains("metal");
    }

    @Test
    void listaDeMagiasCompleta() {
        assertThat(magic.spellsOrEmpty()).hasSize(558);
        RuleMagic.Spell adaga = magic.spellsOrEmpty().stream().filter(s -> s.id().equals("adaga-gelida")).findFirst().orElseThrow();
        assertThat(adaga.level()).isEqualTo(1);
        assertThat(adaga.mysteries()).containsExactly("gelo");
        assertThat(adaga.material()).isEqualTo("uma gota de água ou pedaço de gelo");
        assertThat(adaga.higherLevels()).startsWith("Quando você conjurar");
    }

    @Test
    void magiasDisponiveisPorMisterioClasseEOrigem() {
        // Mistério da Água até o 1º nível: só magias de Água (ou com Água entre os Mistérios).
        assertThat(MagicRules.availableSpells(magic, Set.of("agua"), null, Set.of(), 1))
                .isNotEmpty()
                .allMatch(s -> s.level() <= 1 && s.mysteriesOrEmpty().contains("agua"));
        // Lista do Acólito e lista dos Yordle: Acalmar Emoções está nas duas.
        assertThat(MagicRules.availableSpells(magic, Set.of(), "ACOLYTE", Set.of(), 2)).extracting(RuleMagic.Spell::id).contains("acalmar-emocoes");
        assertThat(MagicRules.availableSpells(magic, Set.of(), null, Set.of("yordle"), 2)).extracting(RuleMagic.Spell::id).contains("acalmar-emocoes");
        // Rajada Mística: truque "Especial", sem Mistério, nas listas de Atirador e Xamã.
        assertThat(MagicRules.availableSpells(magic, Set.of(), "SHAMAN", Set.of(), 0)).extracting(RuleMagic.Spell::id).contains("rajada-mistica");
    }

    @Test
    void regraOpcionalLiberaElementosPeloMisterioEspiritual() {
        assertThat(MagicRules.accessibleElements(magic, Set.of("agua"), Set.of(), Set.of("agua", "adivinhacao"), true))
                .contains("nevasca", "som");
        // Sem Mistério Elemental, ou sem a regra opcional, nada muda.
        assertThat(MagicRules.accessibleElements(magic, Set.of(), Set.of(), Set.of("adivinhacao"), true)).doesNotContain("nevasca");
        assertThat(MagicRules.accessibleElements(magic, Set.of("agua"), Set.of(), Set.of("agua", "adivinhacao"), false)).doesNotContain("nevasca");
    }
}
