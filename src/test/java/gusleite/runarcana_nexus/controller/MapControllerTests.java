package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MapControllerTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void bandopolisComecaSemLugar() throws Exception {
        mvc.perform(get("/map/bandle").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roll").doesNotExist());
    }

    @Test
    void precisaDeLoginParaVer() throws Exception {
        mvc.perform(get("/map/bandle")).andExpect(status().isUnauthorized());
    }

    @Test
    void soOMestreRola() throws Exception {
        mvc.perform(post("/map/bandle/roll").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/map/bandle/roll")).andExpect(status().isUnauthorized());
    }

    @Test
    void aRolagemDoMestreValeParaTodos() throws Exception {
        String body = mvc.perform(post("/map/bandle/roll").header("Authorization", "Bearer " + login("mestre")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"roll\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        int roll = Integer.parseInt(m.group(1));
        assertThat(roll).isBetween(1, 10);

        mvc.perform(get("/map/bandle").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roll").value(roll));
    }

    @Test
    void oMestreMoveOGrupoEATrilhaCresce() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        mvc.perform(get("/map/party").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.x").doesNotExist())
                .andExpect(jsonPath("$.fog").value(false))
                .andExpect(jsonPath("$.trail").isEmpty());
        send(put("/map/party"), player, "{\"x\":10,\"y\":20}").andExpect(status().isForbidden());
        send(put("/map/party"), master, "{\"x\":2000,\"y\":0}").andExpect(status().isBadRequest());

        send(put("/map/party"), master, "{\"x\":-428,\"y\":67,\"label\":\"Demacia\"}").andExpect(status().isOk());
        send(put("/map/party"), master, "{\"x\":-428,\"y\":67}").andExpect(jsonPath("$.trail.length()").value(1));
        send(put("/map/party"), master, "{\"x\":0,\"y\":173}").andExpect(status().isOk());
        mvc.perform(get("/map/party").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.x").value(0))
                .andExpect(jsonPath("$.y").value(173))
                .andExpect(jsonPath("$.trail.length()").value(2))
                .andExpect(jsonPath("$.trail[0].label").value("Demacia"));

        // Limpar a trilha recomeça de onde o grupo está; esconder tira o marcador e mantém a trilha.
        mvc.perform(delete("/map/party/trail").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.trail.length()").value(1))
                .andExpect(jsonPath("$.trail[0].x").value(0));
        mvc.perform(delete("/map/party").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.x").doesNotExist())
                .andExpect(jsonPath("$.trail.length()").value(1));
    }

    @Test
    void nevoaPorRegiao() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        send(put("/map/fog"), player, "{\"enabled\":true}").andExpect(status().isForbidden());
        send(put("/map/fog"), master, "{\"enabled\":true}").andExpect(jsonPath("$.fog").value(true));
        send(put("/map/fog/Demacia!"), master, "{\"revealed\":true}").andExpect(status().isBadRequest());
        send(put("/map/fog/demacia"), master, "{\"revealed\":true}").andExpect(status().isOk());
        send(put("/map/fog/noxus"), master, "{\"revealed\":true}").andExpect(status().isOk());
        send(put("/map/fog/demacia"), master, "{\"revealed\":false}").andExpect(status().isOk());
        mvc.perform(get("/map/party").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.revealed.length()").value(1))
                .andExpect(jsonPath("$.revealed[0]").value("noxus"));
    }

    private org.springframework.test.web.servlet.ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                                                                     String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
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
