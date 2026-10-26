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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
                .andExpect(jsonPath("$.classes[0].hitDie").value(6))
                .andExpect(jsonPath("$.origins[1].lineages[0].levels[0].level").value(2));
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
                // requires: só com a Targon Teste escolhida
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-requer')].reason").value("pré-requisito: Targon Teste"))
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
                // opção com usos próprios (optionUses)
                .andExpect(jsonPath("$.features[?(@.name == 'Resistente (Gélido)')].uses").value(1))
                // anyOf: vale pelo caminho "Resistente (Gélido)"
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-alternativa')].available").value(true))
                // ganho do 2º nível da linhagem não entra na ficha de 1º nível
                .andExpect(jsonPath("$.features[?(@.name == 'Sopro Teste')]").isEmpty())
                .andExpect(jsonPath("$.crafts", hasItem("alquimia")));

        preview(token, tribal.replace("CRAFT:alquimia", "MARTIAL_WEAPON") + ",\"lineageId\":\"sol\"}")
                .andExpect(jsonPath("$.features[?(@.name == 'Proficiência em arma marcial')].source").value("Linhagem: Sol"));

        // anyOf: Resistente (Ígneo) não cumpre nenhum caminho; sem usos próprios.
        preview(token, tribal.replace("Gélido", "Ígneo") + ",\"lineageId\":\"sol\"}")
                .andExpect(jsonPath("$.heritageOptions[?(@.id == 'teste-alternativa')].available").value(false))
                .andExpect(jsonPath("$.features[?(@.name == 'Resistente (Ígneo)')].uses").value(org.hamcrest.Matchers.contains((Object) null)));

        preview(token, tribal + ",\"lineageId\":\"lua\"}")
                .andExpect(jsonPath("$.errors", hasItem("Herança Sol Teste: pré-requisito: Tribal Sol.")));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(tribal + ",\"lineageId\":\"sol\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lineage").value("Sol"));
    }

    @Test
    void runinataMontaAOrigemComTracos() throws Exception {
        String token = login("gaudron");
        // Modo Teste: 1 traço menor e 1 maior. Sem Passado (só com o traço que libera).
        String base = "{\"characterName\":\"Rúnio\",\"age\":5,\"height\":1.2,\"regionId\":\"TARGON\",\"originId\":\"teste-runinata\","
                + "\"classId\":\"ARCANIST\"," + ATTRS + ",\"choices\":{\"origin:teste-runinata:0\":[\"INTELLIGENCE\"],"
                + "\"origin:teste-runinata:1\":[\"SMALL\"],\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"],\"trait:t-garras:0:0\":[\"Cortante\"]}";

        preview(token, base + "}")
                .andExpect(jsonPath("$.errors", hasItem("Escolha o modo de traços combinado com o mestre.")));

        String ok = base + ",\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-escalador\"},{\"id\":\"t-garras\"}]";
        preview(token, ok + "}")
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.traitBudget.minorUsed").value(1))
                .andExpect(jsonPath("$.traitBudget.majorUsed").value(1))
                .andExpect(jsonPath("$.features[?(@.name == 'Garras (Cortante)')].source").value("Traço: Garras Teste"))
                .andExpect(jsonPath("$.features[?(@.name == 'Escalador Teste')].source").value("Traço"))
                // traço silencioso não vira passiva própria
                .andExpect(jsonPath("$.features[?(@.name == 'Garras Teste')]").isEmpty());

        preview(token, ok + ",\"backgroundId\":\"estudioso\"}")
                .andExpect(jsonPath("$.errors", hasItem("Sem o traço Antecedente, a Runinata não tem Passado.")));
        preview(token, ok.replace("t-escalador", "t-antecedente") + "}")
                .andExpect(jsonPath("$.errors", hasItem("Escolha um passado.")));
        preview(token, ok.replace("t-escalador", "t-aranha") + "}")
                .andExpect(jsonPath("$.errors", hasItem("O traço Aranha Teste precisa de: Escalador Teste.")))
                .andExpect(jsonPath("$.traitOptions[?(@.id == 't-aranha')].reason").value("precisa de Escalador Teste"));
        preview(token, base + ",\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-escalador\"}]}")
                .andExpect(jsonPath("$.errors", hasItem("Ainda sobram traços ou pontos de Origem para escolher.")));

        // Superior (6 pontos): 3 de desvantagens + os dois traços do modo convertidos (1 + 2).
        String superior = base + ",\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-super\",\"detail\":\"Voar\"}],"
                + "\"drawbacks\":[{\"id\":\"d-fraco\",\"detail\":\"Ígneo\"},{\"id\":\"d-fraco\",\"detail\":\"Gélido\"},"
                + "{\"id\":\"d-lento\"},{\"id\":\"d-lento\"}]}";
        preview(token, superior.replace(",\"trait:t-garras:0:0\":[\"Cortante\"]", ""))
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.traitBudget.minorConverted").value(true))
                .andExpect(jsonPath("$.traitBudget.majorConverted").value(true))
                .andExpect(jsonPath("$.traitBudget.points").value(6.0))
                .andExpect(jsonPath("$.speed").value(20.0))
                .andExpect(jsonPath("$.features[?(@.name == 'Super Teste (Voar)')].source").value("Traço"))
                .andExpect(jsonPath("$.features[?(@.name == 'Fraco Teste (Ígneo, Gélido) (2×)')].source").value("Desvantagem"));
        preview(token, superior.replace("\"detail\":\"Voar\"", "\"detail\":\" \""))
                .andExpect(jsonPath("$.errors", hasItem("Responda em Super Teste: Qual?")));
        preview(token, superior.replace("{\"id\":\"d-lento\"},", ""))
                .andExpect(jsonPath("$.errors", hasItem("Os traços escolhidos passam do que o modo Teste e as desvantagens permitem.")));

        // Natação que cresce a cada escolha (15, 15, 10) e redução de 5 pés em todos os deslocamentos.
        String swimmer = base + ",\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-garras\"},{\"id\":\"t-nadador\"},{\"id\":\"t-nadador\"},"
                + "{\"id\":\"t-nadador\"}],\"drawbacks\":[{\"id\":\"d-fraco\",\"detail\":\"Ígneo\"},{\"id\":\"d-fraco\",\"detail\":\"Gélido\"},"
                + "{\"id\":\"d-lento\"}]}";
        preview(token, swimmer)
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.speeds[0].type").value("WALK"))
                .andExpect(jsonPath("$.speeds[0].feet").value(25.0))
                .andExpect(jsonPath("$.speeds[1].type").value("SWIM"))
                .andExpect(jsonPath("$.speeds[1].feet").value(35.0));

        // Tamanho fixo de um traço vence a escolha da origem; Herança dá pontos de Heranças Gerais.
        preview(token, base + ",\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-chaveiro\"},{\"id\":\"t-heranca\"}]}")
                .andExpect(jsonPath("$.size").value("TINY"))
                .andExpect(jsonPath("$.heritagePools[0].scope").value("GENERAL"))
                .andExpect(jsonPath("$.heritagePools[0].points").value(2));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(swimmer))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.origin").value("Runinata Teste"))
                .andExpect(jsonPath("$.speed").value(25.0))
                .andExpect(jsonPath("$.speeds[1].type").value("SWIM"))
                .andExpect(jsonPath("$.speeds[1].feet").value(35.0));
    }

    @Test
    void classeComSubclasseProficienciasETabelasPorNivel() throws Exception {
        String token = login("gaudron");
        String mercurial = FULL.replace("\"classId\":\"ARCANIST\"", "\"classId\":\"MERCURIAL\"")
                .replace("\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"]",
                        "\"class:MERCURIAL:0\":[\"WISDOM\"],\"class:MERCURIAL:5\":[\"CRAFT:ferraria\"],\"class:MERCURIAL:6\":[\"A\",\"C\"]");

        preview(token, mercurial)
                .andExpect(jsonPath("$.errors", hasItem("Escolha: Cabala.")));

        String full = mercurial.replace("\"classId\":\"MERCURIAL\"", "\"classId\":\"MERCURIAL\",\"subclassId\":\"sombra\"");
        preview(token, full)
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.savingThrows[?(@.attribute == 'WISDOM')].source").value("Classe: Mercurial Teste"))
                .andExpect(jsonPath("$.armorProficiencies[0]").value("MEDIUM"))
                .andExpect(jsonPath("$.weaponProficiencies[0]").value("Rapieiras"))
                .andExpect(jsonPath("$.craftExpertise[0]").value("ferraria"))
                // dado e usos pela tabela do 1º nível
                .andExpect(jsonPath("$.features[?(@.name == 'Furtivo Teste')].dice").value("1d6"))
                .andExpect(jsonPath("$.features[?(@.name == 'Mana Teste')].uses").value(4))
                // escolha de duas opções
                .andExpect(jsonPath("$.features[?(@.name == 'Duas Teste (A, C)')].source").value("Classe: Mercurial Teste"))
                // d8 + CON (+2) + origem (+1) + Cabala Sombra: metade do mod. de INT 17 (+3) = +1
                .andExpect(jsonPath("$.maxHp").value(12))
                // CA que exige armadura: média sim (proficiente), pesada não
                .andExpect(jsonPath("$.armorClass.options[?(@.label == 'Placa Teste')].value").value(12))
                .andExpect(jsonPath("$.armorClass.options[?(@.label == 'Couraça Teste')]").isEmpty());

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(full))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subclass").value("Cabala Sombra"))
                .andExpect(jsonPath("$.armorProficiencies[0]").value("MEDIUM"))
                .andExpect(jsonPath("$.craftExpertise[0]").value("Ferraria"));
    }

    @Test
    void mestreTravaOModoDeTracos() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        String body = "{\"originId\":\"teste-runinata\",\"traitBudget\":\"OUTRO\"}";

        mvc.perform(put("/creation/settings").header("Authorization", "Bearer " + player)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"traitBudget\":\"TESTE\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/creation/settings").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"traitBudget\":\"NAO-EXISTE\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/creation/settings").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"traitBudget\":\"TESTE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.traitBudget").value("TESTE"));

        // Travado: vale o modo do mestre, mesmo que o jogador mande outro.
        mvc.perform(get("/creation/settings").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.traitBudget").value("TESTE"));
        preview(player, body)
                .andExpect(jsonPath("$.traitBudget.budget").value("TESTE"))
                .andExpect(jsonPath("$.traitBudget.locked").value(true))
                .andExpect(jsonPath("$.errors", not(hasItem("Modo de traços desconhecido."))));

        // Destravado: o jogador volta a escolher.
        mvc.perform(put("/creation/settings").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"traitBudget\":null}"))
                .andExpect(jsonPath("$.traitBudget").doesNotExist());
        preview(player, body)
                .andExpect(jsonPath("$.errors", hasItem("Modo de traços desconhecido.")));
    }

    @Test
    void especialidadeNasPericiasQueJaTem() throws Exception {
        String token = login("gaudron");
        // A classe dá Arcanismo e Intuição. Técnico: Arcanismo, e como já tem, vira especialidade.
        // Especialista: especialidade à escolha entre as que já tem (Intuição).
        String body = "{\"characterName\":\"Sábio\",\"age\":5,\"height\":1.2,\"regionId\":\"TARGON\",\"originId\":\"teste-runinata\","
                + "\"classId\":\"ARCANIST\"," + ATTRS + ",\"choices\":{\"origin:teste-runinata:0\":[\"INTELLIGENCE\"],"
                + "\"origin:teste-runinata:1\":[\"SMALL\"],\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"],\"trait:t-garras:0:0\":[\"Cortante\"],"
                + "\"trait:t-especialista:0:0\":[\"INSIGHT\"]},\"traitBudget\":\"TESTE\","
                + "\"traits\":[{\"id\":\"t-garras\"},{\"id\":\"t-tecnico\"},{\"id\":\"t-especialista\"}],"
                + "\"drawbacks\":[{\"id\":\"d-fraco\",\"detail\":\"Ígneo\"}]}";

        preview(token, body)
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.skills[?(@.skill == 'ARCANA')].expertise").value(true))
                .andExpect(jsonPath("$.skills[?(@.skill == 'INSIGHT')].expertise").value(true))
                // Arcanismo já tem especialidade (Técnico), então sai das opções do Especialista.
                .andExpect(jsonPath("$.choices[?(@.key == 'trait:t-especialista:0:0')].options[0]").value("INSIGHT"));
        preview(token, body.replace("\"trait:t-especialista:0:0\":[\"INSIGHT\"]", "\"trait:t-especialista:0:0\":[\"STEALTH\"]"))
                .andExpect(jsonPath("$.errors", hasItem("Opção inválida em \"Escolha 1 perícia(s) para especialidade\".")));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        // Arcanismo: INT 17 (+3) + proficiência 2 × 2 = 7.
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.character.skills[?(@.skill == 'ARCANA')].expertise").value(true))
                .andExpect(jsonPath("$.character.skills[?(@.skill == 'ARCANA')].modifier").value(7));
    }

    @Test
    void caAlternativaNaPreviaENaFicha() throws Exception {
        String token = login("gaudron");
        // Casca: CA 10 + DES (14 → +2) + CON (14 → +2), e Couro +1 só sem armadura.
        String body = "{\"characterName\":\"Casco\",\"age\":5,\"height\":1.2,\"regionId\":\"TARGON\",\"originId\":\"teste-runinata\","
                + "\"classId\":\"ARCANIST\"," + ATTRS + ",\"choices\":{\"origin:teste-runinata:0\":[\"INTELLIGENCE\"],"
                + "\"origin:teste-runinata:1\":[\"SMALL\"],\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"],\"trait:t-casca:0:0\":[\"CONSTITUTION\"]},"
                + "\"traitBudget\":\"TESTE\",\"traits\":[{\"id\":\"t-escalador\"},{\"id\":\"t-casca\"}]}";

        preview(token, body)
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.armorClass.value").value(15))
                .andExpect(jsonPath("$.armorClass.selected").value("RULE:0"))
                .andExpect(jsonPath("$.armorClass.options[1].label").value("Casca (Constituição)"))
                .andExpect(jsonPath("$.armorClass.options[0].value").value(13))
                .andExpect(jsonPath("$.armorClass.bonuses[0]").value("Couro +1 (sem armadura)"))
                .andExpect(jsonPath("$.armorClass.blockedBy").value("Casca (Constituição)"));

        mvc.perform(post("/creation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.armorClass.value").value(15));

        // Escolher a defesa em uso: sem armadura (10 + 2 + 1) e uma opção que não existe.
        mvc.perform(patch("/character/me/defense").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"UNARMORED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value(13))
                .andExpect(jsonPath("$.selected").value("UNARMORED"));
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.armorClass.selected").value("UNARMORED"));
        mvc.perform(patch("/character/me/defense").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"ITEM:999\"}"))
                .andExpect(status().isBadRequest());
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

    @Test
    void recursosDeClasseComPreRequisitosVelEEscolhaInterna() throws Exception {
        String token = login("gaudron");
        String brute = FULL.replace("\"classId\":\"ARCANIST\"", "\"classId\":\"BRUTE\"")
                .replace(",\"class:ARCANIST:1\":[\"ARCANA\",\"INSIGHT\"]", "");

        // Sem escolher: o Sutra bloqueado pela Sabedoria não aparece; Vel é opcional.
        preview(token, brute)
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:0')].options[0]").value("t-sutra-vento"))
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:0')].note").value("1 opção ainda bloqueada por pré-requisito."))
                .andExpect(jsonPath("$.errors", hasItem("Faltam escolhas: Sutra: escolha um.")))
                .andExpect(jsonPath("$.errors", not(hasItem("Faltam escolhas: Vel (opcional, até 1 ◆)."))));

        String picks = brute.replace("\"choices\":{", "\"choices\":{\"class:BRUTE:0\":[\"t-sutra-vento\"],"
                + "\"class:BRUTE:1\":[\"t-vel-leve\",\"t-vel-pesado\"],\"class:BRUTE:2\":[\"t-tecnica-mestra\"],");
        preview(token, picks)
                // o recurso vira habilidade e as concessões dele valem (CA com dois atributos: 10 + CON + DES)
                .andExpect(jsonPath("$.features[?(@.name == 'Vento Teste')].source").value("Sutra: Vento Teste"))
                .andExpect(jsonPath("$.armorClass.options[?(@.label == 'Reduto Teste')].value").value(14))
                .andExpect(jsonPath("$.errors", hasItem("Vel: os escolhidos ocupam 3 pontos, mas há 1.")))
                // a Técnica traz outra escolha de Sutra, sem o Vento (já escolhido) e sem o bloqueado
                .andExpect(jsonPath("$.choices[?(@.key == 'resource:t-tecnica-mestra:1')].options[0]").doesNotExist())
                .andExpect(jsonPath("$.choices[?(@.key == 'resource:t-tecnica-mestra:1')].note")
                        .value("Nenhuma opção disponível ainda: confira os pré-requisitos com o mestre."));

        // O +4 de Força do próprio Vel não paga a Força 11 dele (sem ele, a Força fica abaixo de 11).
        preview(token, picks.replace("[\"t-vel-leve\",\"t-vel-pesado\"]", "[\"t-vel-forca\"]"))
                .andExpect(jsonPath("$.errors", hasItem("Força Teste: pré-requisito: Força 11.")));

        // Vel que inativa Ki: sai do total (2 − 2 = 0); com mais Ki do que ele tem, fica bloqueado.
        preview(token, picks.replace("[\"t-vel-leve\",\"t-vel-pesado\"]", "[\"t-vel-ki\"]"))
                .andExpect(jsonPath("$.features[?(@.name == 'Ki')].uses").value(0))
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:1')].options", hasItem(hasItem("t-vel-ki"))))
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:1')].options", not(hasItem(hasItem("t-vel-ki-demais")))));
        // Técnica que pede proficiência com uma arma que ele não tem fica bloqueada.
        preview(token, brute)
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:2')].options", not(hasItem(hasItem("t-tecnica-exotica")))))
                .andExpect(jsonPath("$.choices[?(@.key == 'class:BRUTE:2')].note").value("1 opção ainda bloqueada por pré-requisito."));
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
