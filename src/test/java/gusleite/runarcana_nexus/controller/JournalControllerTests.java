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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


// Diário do grupo: entradas escritas e eventos automáticos (ouro, loot, 0 PV, documento).
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class JournalControllerTests {

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

    @Autowired
    private MockMvc mvc;

    @Test
    void cadaUmMexeSoNoQueEscreveu() throws Exception {
        create("gaudron");
        String nyx = login("gaudron");
        String rudo = login("rudo");
        String master = login("mestre");
        mvc.perform(get("/journal")).andExpect(status().isUnauthorized());
        send(post("/journal"), nyx, "{\"title\":\" \",\"body\":\"\"}").andExpect(status().isBadRequest());

        String body = send(post("/journal"), nyx, "{\"title\":\"Dia 1\",\"body\":\"Chegamos a Bandópolis.\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.who").value("Nyx"))
                .andExpect(jsonPath("$.kind").value("NOTE"))
                .andExpect(jsonPath("$.mine").value(true))
                .andReturn().getResponse().getContentAsString();
        long id = id(body);

        mvc.perform(get("/journal").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$[0].title").value("Dia 1"))
                .andExpect(jsonPath("$[0].mine").value(false));
        send(put("/journal/" + id), rudo, "{\"title\":\"Hackeado\"}").andExpect(status().isForbidden());
        send(put("/journal/" + id), nyx, "{\"title\":\"Dia 1\",\"body\":\"Chegamos tarde.\"}").andExpect(jsonPath("$.body").value("Chegamos tarde."));
        send(post("/journal"), master, "{\"body\":\"Lembrete do mestre\"}").andExpect(jsonPath("$.who").value("Mestre"));
        mvc.perform(delete("/journal/" + id).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
        mvc.perform(get("/journal").header("Authorization", "Bearer " + nyx)).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void eventosEntramSozinhos() throws Exception {
        long id = create("gaudron");
        String nyx = login("gaudron");
        String master = login("mestre");
        // Começa sem ouro: só ganho entra no diário.
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":0}").andExpect(status().isOk());
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":40}").andExpect(status().isOk());
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":10}").andExpect(status().isOk());
        send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"t-machado\",\"quantity\":2}").andExpect(status().isOk());
        send(patch("/character/me/hp"), nyx, "{\"currentHp\":0,\"tempHp\":0}").andExpect(status().isOk());
        send(patch("/character/me/hp"), nyx, "{\"currentHp\":0,\"tempHp\":0}").andExpect(status().isOk());
        send(post("/documents"), master, "{\"title\":\"Mapa do tesouro\",\"kind\":\"MAP\",\"body\":\"x\"}").andExpect(status().isCreated());
        send(post("/documents"), master, "{\"title\":\"Traidor\",\"kind\":\"LETTER\",\"body\":\"x\",\"recipients\":[\"gaudron\"]}").andExpect(status().isCreated());

        String journal = mvc.perform(get("/journal").header("Authorization", "Bearer " + nyx))
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].kind").value("DOCUMENT"))
                .andExpect(jsonPath("$[0].title").value("Documento novo para gaudron"))
                .andExpect(jsonPath("$[1].title").value("Documento novo: Mapa do tesouro"))
                .andExpect(jsonPath("$[2].kind").value("DOWNED"))
                .andExpect(jsonPath("$[3].title").value("Nyx recebeu 2× Machado Teste"))
                .andExpect(jsonPath("$[4].title").value("Nyx recebeu 40 PO"))
                .andExpect(jsonPath("$[4].mine").value(false))
                .andReturn().getResponse().getContentAsString();
        assertThat(journal).doesNotContain("Traidor");
        // Evento automático: só o mestre apaga.
        long event = id(journal.substring(1));
        mvc.perform(delete("/journal/" + event).header("Authorization", "Bearer " + nyx)).andExpect(status().isForbidden());
        mvc.perform(delete("/journal/" + event).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
    }

    private static long id(String json) {
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(json);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private long create(String username) throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login(username))
                        .contentType(MediaType.APPLICATION_JSON).content(NYX))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return id(created);
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
