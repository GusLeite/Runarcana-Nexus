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
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Assistente de criação com o catálogo de teste (src/test/resources/rules/criacao-teste.json).
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CreationControllerTests {

    // Compra de pontos: 8+14+14+15+10+8 custa 0+7+7+9+2+0 = 25 de 27.
    private static final String ATTRS = "\"attributeMethod\":\"POINT_BUY\",\"baseAttributes\":"
            + "{\"STRENGTH\":8,\"DEXTERITY\":14,\"CONSTITUTION\":14,\"INTELLIGENCE\":15,\"WISDOM\":10,\"CHARISMA\":8}";
    // Chaves "<fonte>:<id>:<índice da concessão>" (ver criacao-teste.json).
    private static final String CHOICES = "\"choices\":{\"origin:teste-origem:1\":[\"DEXTERITY\"],"
            + "\"origin:teste-origem:5\":[\"SMALL\"],\"origin:teste-origem:6\":[\"ferraria\"],"
            + "\"origin:teste-origem:7\":[\"Targoniano\"],\"origin:teste-origem:10\":[\"STRENGTH\"],"
            + "\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"]}";
    // 2 pontos de Herança de Região (ver herancas-teste.json): uma Geral e uma de Targon.
    private static final String HERITAGES = "\"heritages\":[{\"id\":\"teste-geral\"},{\"id\":\"teste-targon\"}]";
    private static final String FULL = "{\"characterName\":\"Nyx\",\"age\":20,\"height\":1.7,\"regionId\":\"TARGON\","
            + "\"originId\":\"teste-origem\",\"classId\":\"ARCANIST\",\"backgroundId\":\"estudioso\"," + ATTRS + "," + CHOICES
            + "," + HERITAGES + "}";

    @Autowired
    private MockMvc mvc;

    @Test
    void catalogoExigeLogin() throws Exception {
        mvc.perform(get("/creation/catalog")).andExpect(status().isUnauthorized());
        mvc.perform(get("/creation/catalog").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.origins[0].id").value("teste-origem"))
                .andExpect(jsonPath("$.classes[0].hitDie").value(6));
    }

    @Test
    void previaAplicaAsConcessoes() throws Exception {
        preview(login("gaudron"), FULL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.pointBuy.spent").value(25))
                // INT 15 + 2 (origem); DES 14 + 1 (escolha da origem)
                .andExpect(jsonPath("$.attributes[?(@.attribute == 'INTELLIGENCE')].total").value(17))
                .andExpect(jsonPath("$.attributes[?(@.attribute == 'DEXTERITY')].total").value(15))
                // d6 + CON 14 (+2) + metade da proficiência (+1)
                .andExpect(jsonPath("$.maxHp").value(9))
                // 30 pés da origem + 5 da concessão SPEED
                .andExpect(jsonPath("$.speed").value(35.0))
                .andExpect(jsonPath("$.gold").value(50))
                .andExpect(jsonPath("$.skills.length()").value(5))
                .andExpect(jsonPath("$.savingThrows[0].attribute").value("INTELLIGENCE"))
                // 4 da origem e da classe + as 2 Heranças
                .andExpect(jsonPath("$.features.length()").value(6))
                // 1d6 + proficiência (2) + Força 9 (−1)
                .andExpect(jsonPath("$.features[?(@.name == 'Chifres')].dice").value("1d6+1"))
                .andExpect(jsonPath("$.features[?(@.name == 'Targon Teste')].type").value("HERITAGE"))
                .andExpect(jsonPath("$.heritagePools[0].scope").value("REGION"))
                .andExpect(jsonPath("$.heritagePools[0].spent").value(2))
                // Inspirado: metade da proficiência (2 → 1 uso, arredondando para baixo) e 1d4 no bônus +2
                .andExpect(jsonPath("$.features[?(@.name == 'Inspirado')].uses").value(1))
                .andExpect(jsonPath("$.features[?(@.name == 'Inspirado')].dice").value("1d4"))
                .andExpect(jsonPath("$.size").value("SMALL"))
                .andExpect(jsonPath("$.crafts[0]").value("ferraria"))
                .andExpect(jsonPath("$.languages[0]").value("Targoniano"))
                .andExpect(jsonPath("$.heritagePoints").value(2))
                // idioma da região escolhida (Targon)
                .andExpect(jsonPath("$.choices[3].options", hasItem("Targoniano")))
                // HISTORY já vem da origem, então some das opções da classe
                .andExpect(jsonPath("$.choices[5].options", not(hasItem("HISTORY"))))
                // a 2ª escolha de atributo da mesma origem não repete a 1ª (DES)
                .andExpect(jsonPath("$.choices[4].options", not(hasItem("DEXTERITY"))));
    }

    @Test
    void previaListaOQueFalta() throws Exception {
        preview(login("gaudron"), "{\"originId\":\"teste-origem\",\"classId\":\"ARCANIST\"}")
                .andExpect(jsonPath("$.complete").value(false))
                .andExpect(jsonPath("$.errors", hasItem("Escolha um passado.")))
                .andExpect(jsonPath("$.errors", hasItem("Escolha uma região.")))
                .andExpect(jsonPath("$.errors", hasItem("Faltam escolhas: Escolha o tamanho.")))
                .andExpect(jsonPath("$.errors", hasItem("Defina os atributos.")))
                .andExpect(jsonPath("$.errors", hasItem("Faltam escolhas: Escolha 2 perícia(s).")))
                .andExpect(jsonPath("$.errors", hasItem("Dê um nome ao personagem.")));

        String overspent = FULL.replace("\"STRENGTH\":8", "\"STRENGTH\":15");
        preview(login("gaudron"), overspent)
                .andExpect(jsonPath("$.errors", hasItem("Você gastou 34 de 27 pontos.")));

        // +1 em "outro" atributo: repetir a DES da 1ª escolha não vale
        String sameAttribute = FULL.replace("\"origin:teste-origem:10\":[\"STRENGTH\"]", "\"origin:teste-origem:10\":[\"DEXTERITY\"]");
        preview(login("gaudron"), sameAttribute)
                .andExpect(jsonPath("$.errors", hasItem("Opção inválida em \"Escolha 1 atributo(s) para +1\".")));
    }

    @Test
    void criaAFichaLigadaAContaEUmaSo() throws Exception {
        String token = login("gaudron");
        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(FULL))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.characterName").value("Nyx"))
                .andExpect(jsonPath("$.origin").value("Origem Teste"))
                .andExpect(jsonPath("$.level").value(1))
                .andExpect(jsonPath("$.intel").value(17))
                .andExpect(jsonPath("$.maxHp").value(9))
                .andExpect(jsonPath("$.savingThrows[0]").value("INTELLIGENCE"));

        // A conta "gaudron" acha a ficha "Nyx" pela ligação direta, não pelo nome.
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.character.characterName").value("Nyx"))
                .andExpect(jsonPath("$.character.background").value("Estudioso"))
                .andExpect(jsonPath("$.abilities.length()").value(6))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Chifres')].damage").value("1d6+1"))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Geral Teste')].type").value("HERITAGE"))
                .andExpect(jsonPath("$.character.heritages", hasItem("Targon Teste")))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Inspirado')].maxUses").value(1))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Inspirado')].damage").value("1d4"))
                .andExpect(jsonPath("$.character.size").value("SMALL"))
                .andExpect(jsonPath("$.character.speed").value(35.0))
                .andExpect(jsonPath("$.character.languages[0]").value("Targoniano"))
                // a ficha guarda o nome do ofício, não o id
                .andExpect(jsonPath("$.character.crafts[0]").value("Ferraria"))
                // os 2 pontos foram gastos no assistente
                .andExpect(jsonPath("$.character.heritagePoints").value(0))
                .andExpect(jsonPath("$.character.skills[?(@.skill == 'ARCANA')].proficient").value(true));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(FULL))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Você já tem uma ficha."));
    }

    @Test
    void regiaoSemIdiomasCadastradosNaoBloqueia() throws Exception {
        // Noxus não tem idiomas no catálogo de teste: a escolha vira aviso e a ficha pode ser criada.
        String noxus = FULL.replace("\"regionId\":\"TARGON\"", "\"regionId\":\"NOXUS\"")
                .replace(",\"origin:teste-origem:7\":[\"Targoniano\"]", "")
                .replace("teste-targon", "teste-noxus");
        preview(login("gaudron"), noxus)
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.choices[3].note").value("Os idiomas desta região ainda não foram cadastrados nas regras."));
    }

    @Test
    void herancasConferemPontosEPreRequisitos() throws Exception {
        String token = login("gaudron");
        String wrong = FULL.replace(HERITAGES, "\"heritages\":[{\"id\":\"teste-targon\"},{\"id\":\"teste-rival\"},"
                + "{\"id\":\"teste-forte\"},{\"id\":\"teste-origem-heranca\"},{\"id\":\"teste-tribo\"}]");
        preview(token, wrong)
                .andExpect(jsonPath("$.complete").value(false))
                .andExpect(jsonPath("$.errors", hasItem("Herança Rival Teste: não pode junto com Targon Teste.")))
                .andExpect(jsonPath("$.errors", hasItem("Herança Força Teste: pré-requisito: Força 18.")))
                .andExpect(jsonPath("$.errors", hasItem("Herança Origem Teste Herança: seus pontos não compram Heranças de Origem.")))
                .andExpect(jsonPath("$.errors", hasItem("Escolha a opção de Tribo Teste.")))
                .andExpect(jsonPath("$.errors", hasItem("Você escolheu mais Heranças do que tem pontos.")))
                // De outra região: aparece como indisponível, com o motivo
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-noxus')].available").value(false))
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-noxus')].reason").value("pré-requisito: Noxiano"));

        // A mesma Herança duas vezes (maxTimes 2) com a opção escolhida
        preview(token, FULL.replace(HERITAGES, "\"heritages\":[{\"id\":\"teste-tribo\",\"option\":\"Sol\"},{\"id\":\"teste-tribo\"}]"))
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.heritages[0].times").value(2))
                .andExpect(jsonPath("$.features[?(@.name == 'Tribo Teste (Sol) (2×)')].source").value("Herança"));

        preview(token, FULL.replace("," + HERITAGES, ""))
                .andExpect(jsonPath("$.errors", hasItem("Gaste os 2 pontos de Herança que faltam.")));
    }

    @Test
    void linhagemEObrigatoriaEValeComoPreRequisito() throws Exception {
        String token = login("gaudron");
        String tribal = "{\"characterName\":\"Ali\",\"age\":30,\"height\":2.0,\"regionId\":\"TARGON\",\"originId\":\"teste-tribal\","
                + "\"classId\":\"ARCANIST\",\"backgroundId\":\"estudioso\"," + ATTRS
                + ",\"choices\":{\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"],\"lineage:sol:1\":[\"Gélido\"],"
                + "\"lineage:sol:2\":[\"CRAFT:alquimia\"]},\"heritages\":[{\"id\":\"teste-sol\"}]";

        preview(token, tribal + "}")
                .andExpect(jsonPath("$.errors", hasItem("Escolha a linhagem.")))
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-sol')].available").value(false));

        // Linhagem Sol: concessões com a fonte "Linhagem: Sol"; usos = mod. de CON (14 → +2)
        preview(token, tribal + ",\"lineageId\":\"sol\"}")
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.features[?(@.name == 'Urro Teste')].source").value("Linhagem: Sol"))
                .andExpect(jsonPath("$.features[?(@.name == 'Urro Teste')].uses").value(2))
                // habilidade com opção e proficiência mista (aqui, um ofício)
                .andExpect(jsonPath("$.features[?(@.name == 'Resistente (Gélido)')].source").value("Linhagem: Sol"))
                .andExpect(jsonPath("$.crafts", hasItem("alquimia")));

        preview(token, tribal.replace("CRAFT:alquimia", "MARTIAL_WEAPON") + ",\"lineageId\":\"sol\"}")
                .andExpect(jsonPath("$.features[?(@.name == 'Proficiência em arma marcial')].source").value("Linhagem: Sol"));

        preview(token, tribal + ",\"lineageId\":\"lua\"}")
                .andExpect(jsonPath("$.errors", hasItem("Herança Sol Teste: pré-requisito: Tribal Sol.")));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(tribal + ",\"lineageId\":\"sol\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lineage").value("Sol"));
    }

    @Test
    void recusaCriacaoIncompletaEOMestre() throws Exception {
        mvc.perform(post("/creation").header("Authorization", "Bearer " + login("loge"))
                        .contentType(MediaType.APPLICATION_JSON).content(FULL.replace("\"Nyx\"", "\" \"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Dê um nome ao personagem."));
        mvc.perform(post("/creation").header("Authorization", "Bearer " + login("mestre"))
                        .contentType(MediaType.APPLICATION_JSON).content(FULL))
                .andExpect(status().isForbidden());
    }

    private ResultActions preview(String token, String body) throws Exception {
        return mvc.perform(post("/creation/preview").header("Authorization", "Bearer " + token)
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
