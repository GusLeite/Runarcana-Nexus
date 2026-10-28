package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Subida de nível pelo mestre, com o catálogo de teste (criacao-teste.json e aprimoramentos-teste.json).
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LevelUpControllerTests {

    // O mesmo Nyx do CreationControllerTests: Arcanista, INT 17, DES 15, CON 14, PV 9 (d6 + CON 2 + metade da
    // proficiência da origem, que soma em cada nível).
    private static final String NYX = "{\"characterName\":\"Nyx\",\"age\":20,\"height\":1.7,\"regionId\":\"TARGON\","
            + "\"originId\":\"teste-origem\",\"classId\":\"ARCANIST\",\"backgroundId\":\"estudioso\","
            + "\"attributeMethod\":\"POINT_BUY\",\"baseAttributes\":"
            + "{\"STRENGTH\":8,\"DEXTERITY\":14,\"CONSTITUTION\":14,\"INTELLIGENCE\":15,\"WISDOM\":10,\"CHARISMA\":8},"
            + "\"choices\":{\"origin:teste-origem:1\":[\"DEXTERITY\"],"
            + "\"origin:teste-origem:5\":[\"SMALL\"],\"origin:teste-origem:6\":[\"ferraria\"],"
            + "\"origin:teste-origem:7\":[\"Targoniano\"],\"origin:teste-origem:10\":[\"STRENGTH\"],"
            + "\"runic-nature:0\":[\"Rubi\"],\"runic-nature:1\":[\"t-runa-rubi\"],"
            + "\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"]},"
            + "\"heritages\":[{\"id\":\"teste-geral\"},{\"id\":\"teste-targon\"}]}";
    private static final String LEVEL_2 = "{\"levels\":[{\"hpRoll\":4}]}";

    @Autowired
    private MockMvc mvc;

    @Test
    void soOMestreSobeDeNivel() throws Exception {
        long id = createNyx();
        String player = login("gaudron");
        mvc.perform(post("/character/" + id + "/level-up/preview").header("Authorization", "Bearer " + player)
                        .contentType(MediaType.APPLICATION_JSON).content(LEVEL_2))
                .andExpect(status().isForbidden());
        mvc.perform(post("/character/" + id + "/level-up").header("Authorization", "Bearer " + player)
                        .contentType(MediaType.APPLICATION_JSON).content(LEVEL_2))
                .andExpect(status().isForbidden());
        mvc.perform(post("/character/999/level-up/preview").header("Authorization", "Bearer " + login("mestre"))
                        .contentType(MediaType.APPLICATION_JSON).content(LEVEL_2))
                .andExpect(status().isNotFound());
    }

    @Test
    void previaMostraPvEOQueFalta() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        levelUpPreview(master, id, LEVEL_2)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentLevel").value(1))
                .andExpect(jsonPath("$.newLevel").value(2))
                // 9 + (4 + CON 2) + 1 da origem (por nível) + 1 (HP_BONUS do 2º nível do Arcanista de teste)
                .andExpect(jsonPath("$.newMaxHp").value(17))
                .andExpect(jsonPath("$.hpGain").value(8))
                .andExpect(jsonPath("$.preview.complete").value(true))
                .andExpect(jsonPath("$.preview.classLevels[0].level").value(2));
        // Sem o dado de vida, ou acima do dado da classe (d6), não dá.
        levelUpPreview(master, id, "{\"levels\":[{}]}")
                .andExpect(jsonPath("$.preview.errors", hasItem("2º nível: informe o dado de vida (1d6).")));
        levelUpPreview(master, id, "{\"levels\":[{\"hpRoll\":7}]}")
                .andExpect(jsonPath("$.preview.errors", hasItem("2º nível: informe o dado de vida (1d6).")));
        levelUp(master, id, "{\"levels\":[{}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("2º nível: informe o dado de vida (1d6)."));
    }

    @Test
    void aplicarMantemUsosGastosEHabilidadesDoMestre() throws Exception {
        long id = createNyx();
        String player = login("gaudron");
        String master = login("mestre");
        // O jogador gasta o único uso do Inspirado; o mestre cadastra uma habilidade à mão.
        String sheet = mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andReturn().getResponse().getContentAsString();
        Matcher inspired = Pattern.compile("\"id\":(\\d+),\"name\":\"Inspirado\"").matcher(sheet);
        assertThat(inspired.find()).isTrue();
        mvc.perform(patch("/character/me/abilities/" + inspired.group(1)).header("Authorization", "Bearer " + player)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usesLeft\":0}"))
                .andExpect(status().isOk());
        mvc.perform(post("/character/" + id + "/abilities").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Bênção do Mestre\",\"type\":\"PASSIVE\"}"))
                .andExpect(status().isCreated());

        levelUp(master, id, LEVEL_2)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.level").value(2))
                .andExpect(jsonPath("$.maxHp").value(17))
                .andExpect(jsonPath("$.currentHp").value(17))
                .andExpect(jsonPath("$.classLevels[0].classId").value("ARCANIST"))
                .andExpect(jsonPath("$.classLevels[0].level").value(2));
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.abilities.length()").value(10))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Inspirado')].usesLeft").value(0))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Bênção do Mestre')].type").value("PASSIVE"));

        // 3º nível: a habilidade com usos pelo nível da classe passa de 1 para 2 usos.
        levelUp(master, id, "{\"levels\":[{\"hpRoll\":1}]}")
                .andExpect(jsonPath("$.level").value(3))
                .andExpect(jsonPath("$.maxHp").value(21));
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Truque de Teste')].maxUses").value(2))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Truque de Teste')].usesLeft").value(2));
    }

    @Test
    void aprimoramentoDoQuartoNivel() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        levelUp(master, id, "{\"levels\":[{\"hpRoll\":3},{\"hpRoll\":3}]}").andExpect(status().isOk());
        String key = "level:4:class:ARCANIST:0";
        // Sem escolher: falta o Aprimoramento; o "Arcanista 8" fica bloqueado.
        levelUpPreview(master, id, "{\"levels\":[{\"hpRoll\":3}]}")
                .andExpect(jsonPath("$.preview.errors", hasItem("Faltam escolhas: Aprimoramento: aumento de atributo ou um Aprimoramento.")))
                .andExpect(jsonPath("$.preview.choices[?(@.key == '" + key + "')].options[*]", hasItem("aumento-atributo-2")))
                .andExpect(jsonPath("$.preview.choices[?(@.key == '" + key + "')].options[*]", not(hasItem("aprimoramento-mestre-arcano"))));
        // +2 em Inteligência (17 → 19). A escolha interna é a concessão 1 do recurso (a 0 é a habilidade com o texto).
        String asi = "{\"levels\":[{\"hpRoll\":3,\"choices\":{\"" + key + "\":[\"aumento-atributo-2\"],"
                + "\"resource:aumento-atributo-2@" + key + ":1\":[\"INTELLIGENCE\"]}}]}";
        levelUpPreview(master, id, asi)
                .andExpect(jsonPath("$.preview.complete").value(true))
                .andExpect(jsonPath("$.attributeChanges[0]").value("INT 17 → 19"));
        levelUp(master, id, asi)
                .andExpect(jsonPath("$.level").value(4))
                .andExpect(jsonPath("$.intel").value(19));
    }

    @Test
    void multiclasseComProficienciasReduzidasEPreRequisito() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        // Mercurial de teste: DES 13 (Nyx tem 15) e só armadura leve de multiclasse; a subclasse é obrigatória.
        levelUpPreview(master, id, "{\"levels\":[{\"classId\":\"MERCURIAL\",\"hpRoll\":5}]}")
                .andExpect(jsonPath("$.preview.errors", hasItem("2º nível: escolha Cabala de Mercurial Teste.")));
        levelUpPreview(master, id, "{\"levels\":[{\"classId\":\"MERCURIAL\",\"subclassId\":\"sombra\",\"hpRoll\":5}]}")
                .andExpect(jsonPath("$.preview.classLevels[0].classId").value("ARCANIST"))
                .andExpect(jsonPath("$.preview.classLevels[1].classId").value("MERCURIAL"))
                .andExpect(jsonPath("$.preview.classLevels[1].level").value(1))
                .andExpect(jsonPath("$.preview.armorProficiencies", hasItem("LIGHT")))
                // a resistência à escolha do Mercurial é só de quem começa nele
                .andExpect(jsonPath("$.preview.savingThrows.length()").value(1))
                // 9 + (5 + 2) + 1 da origem + 2 da Cabala de teste (metade do mod. de um atributo)
                .andExpect(jsonPath("$.newMaxHp").value(19));
        // Com DES 9 (base 8 + 1 da origem) o Mercurial não entra.
        String clumsy = NYX.replace("\"origin:teste-origem:1\":[\"DEXTERITY\"]", "\"origin:teste-origem:1\":[\"STRENGTH\"]")
                .replace("\"origin:teste-origem:10\":[\"STRENGTH\"]", "\"origin:teste-origem:10\":[\"DEXTERITY\"]")
                .replace("\"DEXTERITY\":14", "\"DEXTERITY\":8").replace("\"WISDOM\":10", "\"WISDOM\":14").replace("\"CHARISMA\":8", "\"CHARISMA\":10");
        long other = create("rudo", clumsy);
        levelUpPreview(master, other, "{\"levels\":[{\"classId\":\"MERCURIAL\",\"subclassId\":\"sombra\",\"hpRoll\":5}]}")
                .andExpect(jsonPath("$.preview.errors", hasItem("Multiclasse com Mercurial Teste: pré-requisito Destreza 13.")));
    }

    @Test
    void magiasPreparadasNoDescansoLongo() throws Exception {
        long id = createNyx();
        String player = login("gaudron");
        // Arcanista de teste prepara INT (+3) + nível (1) = 4, da lista dele até o 1º nível.
        mvc.perform(get("/character/me/preparation").header("Authorization", "Bearer " + player))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classes[0].classId").value("ARCANIST"))
                .andExpect(jsonPath("$.classes[0].limit").value(4))
                .andExpect(jsonPath("$.classes[0].maxSpellLevel").value(1))
                .andExpect(jsonPath("$.classes[0].options.length()").value(1))
                .andExpect(jsonPath("$.classes[0].options[0].key").value("spell:t-escudo-arcano"))
                .andExpect(jsonPath("$.classes[0].prepared.length()").value(0));
        // Magia de 2º nível e classe que não prepara: recusadas, e o descanso não acontece.
        rest(player, "{\"type\":\"LONG\",\"prepared\":{\"ARCANIST\":[\"spell:t-misseis\"]}}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Há magia que Arcanista não pode preparar agora."));
        rest(player, "{\"type\":\"LONG\",\"prepared\":{\"BRUTE\":[]}}")
                .andExpect(status().isBadRequest());

        rest(player, "{\"type\":\"LONG\",\"prepared\":{\"ARCANIST\":[\"spell:t-escudo-arcano\"]}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Escudo Arcano Teste')].prepared").value(true));
        mvc.perform(get("/character/me/preparation").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.classes[0].prepared[0]").value("spell:t-escudo-arcano"));
        // O descanso curto não troca as preparadas.
        rest(player, "{\"type\":\"SHORT\",\"prepared\":{\"ARCANIST\":[]}}")
                .andExpect(jsonPath("$[?(@.name == 'Escudo Arcano Teste')].prepared").value(true));

        // A subida de nível mantém as preparadas; no 3º nível, as de 2º entram nas opções.
        levelUp(login("mestre"), id, "{\"levels\":[{\"hpRoll\":3},{\"hpRoll\":3}]}").andExpect(status().isOk());
        mvc.perform(get("/character/me/preparation").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.classes[0].limit").value(6))
                .andExpect(jsonPath("$.classes[0].maxSpellLevel").value(2))
                .andExpect(jsonPath("$.classes[0].options[*].key", hasItem("spell:t-misseis")))
                .andExpect(jsonPath("$.classes[0].prepared[0]").value("spell:t-escudo-arcano"));
        // Lista vazia desprepara tudo.
        rest(player, "{\"type\":\"LONG\",\"prepared\":{\"ARCANIST\":[]}}")
                .andExpect(jsonPath("$[?(@.name == 'Escudo Arcano Teste')]").isEmpty());
    }

    @Test
    void manaSomadaNaMulticlasse() throws Exception {
        long id = createNyx();
        // Arcanista 2 (3 de Mana) + Mercurial 1 (4, pela tabela dele): uma habilidade só, com a soma.
        levelUpPreview(login("mestre"), id, "{\"levels\":[{\"hpRoll\":3},{\"classId\":\"MERCURIAL\",\"subclassId\":\"sombra\",\"hpRoll\":5}]}")
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Pontos de Mana')]", hasSize(1)))
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Pontos de Mana')].uses").value(7));
    }

    @Test
    void trocaDeMagiaConhecidaAoSubir() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        // Arcanista 2, Mercurial 1, Mercurial 2 (aprende Sombra A), Mercurial 3 (troca Sombra A por Sombra B).
        String base = "{\"levels\":[{\"hpRoll\":3},{\"classId\":\"MERCURIAL\",\"subclassId\":\"sombra\",\"hpRoll\":5},"
                + "{\"classId\":\"MERCURIAL\",\"hpRoll\":5,\"choices\":{\"level:4:class:MERCURIAL:0\":[\"t-sombra-a\"]}},"
                + "{\"classId\":\"MERCURIAL\",\"hpRoll\":5,\"choices\":{%s}}]}";
        levelUpPreview(master, id, base.formatted("\"level:5:spell-swap:out\":[\"t-sombra-a\"],\"level:5:spell-swap:in\":[\"t-sombra-b\"]"))
                .andExpect(jsonPath("$.preview.choices[?(@.key == 'level:5:spell-swap:out')].options[*]", hasItem("t-sombra-a")))
                .andExpect(jsonPath("$.preview.choices[?(@.key == 'level:5:spell-swap:in')].options[*]", hasItem("t-sombra-b")))
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Sombra B Teste')].source").value("Troca de magia (5º nível)"))
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Sombra A Teste')]").isEmpty());
        // Sem trocar, Sombra A continua; só a que sai, sem a que entra, é erro.
        levelUpPreview(master, id, base.formatted(""))
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Sombra A Teste')]", hasSize(1)));
        levelUpPreview(master, id, base.formatted("\"level:5:spell-swap:out\":[\"t-sombra-a\"]"))
                .andExpect(jsonPath("$.preview.errors", hasItem("Troca de magia do 5º nível: escolha a que sai e a que entra (ou nenhuma).")));
    }

    @Test
    void recursoComGanhosPeloNivelDaClasse() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        levelUp(master, id, "{\"levels\":[{\"hpRoll\":3},{\"hpRoll\":3}]}").andExpect(status().isOk());
        String pick = "{\"hpRoll\":3,\"choices\":{\"level:4:class:ARCANIST:0\":[\"aprimoramento-progressivo\"]}}";
        // Escolhido no 4º nível de Arcanista: o ganho do 4º entra junto; o do 5º, só no 5º. Robusto de teste: +3 (metade do d6).
        levelUpPreview(master, id, "{\"levels\":[" + pick + "]}")
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Progresso 4')]", hasSize(1)))
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Progresso 5')]").isEmpty())
                .andExpect(jsonPath("$.hpGain").value(9));
        levelUpPreview(master, id, "{\"levels\":[" + pick + ",{\"hpRoll\":3}]}")
                .andExpect(jsonPath("$.preview.features[?(@.name == 'Progresso 5')].source").value("Aprimoramento: Progressivo (5º nível)"));
    }

    private ResultActions rest(String token, String body) throws Exception {
        return mvc.perform(post("/character/me/rest").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private long createNyx() throws Exception {
        return create("gaudron", NYX);
    }

    private long create(String username, String body) throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login(username))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(created);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private ResultActions levelUpPreview(String token, long id, String body) throws Exception {
        return mvc.perform(post("/character/" + id + "/level-up/preview").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions levelUp(String token, long id, String body) throws Exception {
        return mvc.perform(post("/character/" + id + "/level-up").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // Contas do seed: senha inicial igual ao nome do usuário.
    private String login(String username) throws Exception {
        String body = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + username + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }
}
