package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.CombatService;
import gusleite.runarcana_nexus.services.CombatTestAccess;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.security.SecureRandom;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Combate: bestiário, montar e ativar o confronto, o que os jogadores veem, iniciativa e turnos.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CombatControllerTests {

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

    private static final String WOLF = "{\"name\":\"Lobo\",\"maxHp\":11,\"armorClass\":13,\"initiativeBonus\":2,"
            + "\"image\":\"https://exemplo.com/lobo.png\",\"attacks\":\"Mordida +4, 2d4+2\",\"notes\":\"Foge com metade dos PV\"}";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CombatService combat;

    @AfterEach
    void unfix() {
        CombatTestAccess.random(combat, new SecureRandom());
    }

    @Test
    void bestiarioSoDoMestre() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        send(post("/combat/enemies"), rudo, WOLF).andExpect(status().isForbidden());
        mvc.perform(get("/combat/enemies")).andExpect(status().isUnauthorized());
        long wolf = id(send(post("/combat/enemies"), master, WOLF).andExpect(status().isCreated()));
        send(post("/combat/enemies"), master, "{\"name\":\" \"}").andExpect(status().isBadRequest());
        send(post("/combat/enemies"), master, "{\"name\":\"X\",\"maxHp\":0}").andExpect(status().isBadRequest());
        send(post("/combat/enemies"), master, "{\"name\":\"X\",\"image\":\"ftp://x\"}").andExpect(status().isBadRequest());
        send(put("/combat/enemies/" + wolf), master, "{\"name\":\"Lobo Atroz\",\"maxHp\":37,\"armorClass\":14}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.maxHp").value(37)).andExpect(jsonPath("$.str").value(10));
        mvc.perform(get("/combat/enemies").header("Authorization", "Bearer " + master)).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void confrontoAtivoParaOsJogadoresSemOsNumerosDosInimigos() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        long wolf = id(send(post("/combat/enemies"), master, WOLF));
        String created = send(post("/combat/encounters"), master,
                "{\"name\":\"Emboscada na estrada\",\"characterIds\":[],\"enemies\":[{\"enemyId\":" + wolf + ",\"count\":3}]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.order", hasSize(3)))
                .andExpect(jsonPath("$.order[0].name").value("Lobo 1"))
                .andExpect(jsonPath("$.order[2].name").value("Lobo 3"))
                .andReturn().getResponse().getContentAsString();
        long encounter = firstId(created);
        // Mais um escondido (emboscada): vira o "Lobo 4" e os jogadores não o veem.
        send(post("/combat/encounters/" + encounter + "/combatants"), master, "{\"enemyId\":" + wolf + ",\"hidden\":true}")
                .andExpect(jsonPath("$.order", hasSize(4))).andExpect(jsonPath("$.order[3].name").value("Lobo 4"));

        mvc.perform(get("/combat/active").header("Authorization", "Bearer " + rudo)).andExpect(status().isNoContent());
        send(post("/combat/encounters/" + encounter + "/start"), rudo, "{}").andExpect(status().isForbidden());
        send(post("/combat/encounters/" + encounter + "/start"), master, "{}").andExpect(jsonPath("$.status").value("ACTIVE"));

        long lobo1 = combatantId(master, 0);
        send(patch("/combat/encounters/" + encounter + "/combatants/" + lobo1), master, "{\"currentHp\":4}")
                .andExpect(jsonPath("$.order[0].currentHp").value(4));

        mvc.perform(get("/combat/active").header("Authorization", "Bearer " + rudo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.master").value(false))
                .andExpect(jsonPath("$.order", hasSize(3)))
                .andExpect(jsonPath("$.order[0].currentHp").value(nullValue()))
                .andExpect(jsonPath("$.order[0].armorClass").value(nullValue()))
                .andExpect(jsonPath("$.order[0].initiativeBonus").value(nullValue()))
                .andExpect(jsonPath("$.order[0].health").value("Sangrando"))
                .andExpect(jsonPath("$.order[1].health").value("Ileso"));

        // 0 PV derruba; encerrar tira o confronto da mesa.
        send(patch("/combat/encounters/" + encounter + "/combatants/" + lobo1), master, "{\"currentHp\":0}")
                .andExpect(jsonPath("$.order[0].defeated").value(true));
        send(post("/combat/encounters/" + encounter + "/end"), master, "{}").andExpect(jsonPath("$.status").value("ENDED"));
        mvc.perform(get("/combat/active").header("Authorization", "Bearer " + rudo)).andExpect(status().isNoContent());
        mvc.perform(delete("/combat/encounters/" + encounter).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
    }

    @Test
    void iniciativaOrdemETurnos() throws Exception {
        long nyx = create();
        String master = login("mestre");
        String player = login("gaudron");
        long wolf = id(send(post("/combat/enemies"), master, WOLF));
        long encounter = firstId(send(post("/combat/encounters"), master,
                "{\"name\":\"Ponte\",\"characterIds\":[" + nyx + "],\"enemies\":[{\"enemyId\":" + wolf + ",\"count\":2}]}")
                .andReturn().getResponse().getContentAsString());
        send(post("/combat/encounters/" + encounter + "/start"), master, "{}");

        // Inimigos: d20 = 10, bônus 2 → 12.
        CombatTestAccess.random(combat, fixed(10));
        send(post("/combat/encounters/" + encounter + "/initiative"), master, "{\"who\":\"ENEMIES\"}")
                .andExpect(jsonPath("$.rolled", hasSize(2)))
                .andExpect(jsonPath("$.rolled[0].total").value(12));

        // O jogador rola a dele uma vez (d20 = 18 + DES), e vai para o topo; a segunda é recusada.
        CombatTestAccess.random(combat, fixed(18));
        send(post("/combat/active/initiative"), player, "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roll.d20").value(18))
                .andExpect(jsonPath("$.roll.label").value("Iniciativa"))
                .andExpect(jsonPath("$.encounter.order[0].name").value("Nyx"))
                .andExpect(jsonPath("$.encounter.order[0].mine").value(true));
        send(post("/combat/active/initiative"), player, "{}").andExpect(status().isBadRequest());
        send(post("/combat/active/initiative"), login("rudo"), "{}").andExpect(status().isNotFound());

        // O mestre ajusta: Lobo 2 com 25 passa à frente; o d20 dele deixa de valer.
        long lobo2 = combatantIdByName(master, "Lobo 2");
        send(patch("/combat/encounters/" + encounter + "/combatants/" + lobo2), master, "{\"initiative\":25}")
                .andExpect(jsonPath("$.order[0].name").value("Lobo 2"))
                .andExpect(jsonPath("$.order[0].initiativeD20").value(nullValue()));

        // Turnos: começa no primeiro; passar do último abre a rodada 2; derrotado é pulado.
        send(post("/combat/encounters/" + encounter + "/turn"), master, "{\"step\":1}")
                .andExpect(jsonPath("$.currentId").value(lobo2)).andExpect(jsonPath("$.round").value(1));
        long nyxCombatant = combatantIdByName(master, "Nyx");
        long lobo1 = combatantIdByName(master, "Lobo 1");
        send(patch("/combat/encounters/" + encounter + "/combatants/" + lobo1), master, "{\"defeated\":true}");
        send(post("/combat/encounters/" + encounter + "/turn"), master, "{\"step\":1}").andExpect(jsonPath("$.currentId").value(nyxCombatant));
        send(post("/combat/encounters/" + encounter + "/turn"), master, "{\"step\":1}")
                .andExpect(jsonPath("$.currentId").value(lobo2)).andExpect(jsonPath("$.round").value(2));
        send(post("/combat/encounters/" + encounter + "/turn"), master, "{\"step\":-1}")
                .andExpect(jsonPath("$.currentId").value(nyxCombatant)).andExpect(jsonPath("$.round").value(1));

        // Recomeçar: volta a rascunho, sem iniciativa, inimigos de pé.
        send(post("/combat/encounters/" + encounter + "/reset"), master, "{}")
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.currentId").value(nullValue()))
                .andExpect(jsonPath("$.order[2].initiative").value(nullValue()))
                .andExpect(jsonPath("$.order[2].defeated").value(false));
    }

    private static Random fixed(int d20) {
        return new Random() {
            @Override
            public int nextInt(int origin, int bound) {
                return d20;
            }
        };
    }

    private long combatantId(String master, int index) throws Exception {
        String body = mvc.perform(get("/combat/active").header("Authorization", "Bearer " + master)).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\\{\"id\":(\\d+),\"kind\"").matcher(body);
        for (int i = 0; i <= index; i++) assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private long combatantIdByName(String master, String name) throws Exception {
        String body = mvc.perform(get("/combat/active").header("Authorization", "Bearer " + master)).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\\{\"id\":(\\d+),\"kind\":\"[A-Z]+\",\"characterId\":[^,]+,\"enemyId\":[^,]+,\"name\":\"" + name + "\"").matcher(body);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static long id(ResultActions actions) throws Exception {
        return firstId(actions.andReturn().getResponse().getContentAsString());
    }

    private static long firstId(String body) {
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private long create() throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login("gaudron"))
                        .contentType(MediaType.APPLICATION_JSON).content(NYX))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return firstId(created);
    }

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
