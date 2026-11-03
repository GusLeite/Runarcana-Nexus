package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Trajetórias dos jogadores: cada um desenha as suas, o mestre lê as de todos e só o dono mexe.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MapRouteTests {

    private static final String ROUTE = "{\"name\":\"Rota do norte\",\"points\":[{\"x\":0,\"y\":0},{\"x\":50.5,\"y\":-20},{\"x\":90,\"y\":40}]}";

    @Autowired
    private MockMvc mvc;

    @Test
    void ojogadorDesenhaEditaEApagaASuaTrajetoria() throws Exception {
        String player = login("gaudron");
        String body = send(post("/map/routes"), player, ROUTE)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.owner").value("gaudron"))
                .andExpect(jsonPath("$.points.length()").value(3))
                .andExpect(jsonPath("$.points[1].x").value(50.5))
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        String id = m.group(1);

        send(put("/map/routes/" + id), player, "{\"name\":\"Rota nova\",\"points\":[{\"x\":1,\"y\":1},{\"x\":2,\"y\":2}]}")
                .andExpect(jsonPath("$.name").value("Rota nova"))
                .andExpect(jsonPath("$.points.length()").value(2));
        mvc.perform(delete("/map/routes/" + id).header("Authorization", "Bearer " + player)).andExpect(status().isNoContent());
        mvc.perform(get("/map/routes").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void oMestreLeAsDeTodosEOutroJogadorNaoMexe() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        String other = login("rudo");
        String body = send(post("/map/routes"), player, ROUTE).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        String id = m.group(1);
        send(post("/map/routes"), other, ROUTE).andExpect(status().isCreated());

        mvc.perform(get("/map/routes").header("Authorization", "Bearer " + master)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/map/routes").header("Authorization", "Bearer " + other)).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/map/routes").param("as", "gaudron").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].owner").value("gaudron"));
        mvc.perform(get("/map/routes").param("as", "gaudron").header("Authorization", "Bearer " + other)).andExpect(status().isForbidden());
        send(put("/map/routes/" + id), other, ROUTE).andExpect(status().isNotFound());
        mvc.perform(delete("/map/routes/" + id).header("Authorization", "Bearer " + other)).andExpect(status().isNotFound());
        send(post("/map/routes"), master, ROUTE).andExpect(status().isBadRequest());
    }

    @Test
    void validaPontosNomeELimite() throws Exception {
        String player = login("gaudron");
        send(post("/map/routes"), player, "{\"name\":\"curta\",\"points\":[{\"x\":0,\"y\":0}]}").andExpect(status().isBadRequest());
        send(post("/map/routes"), player, "{\"name\":\"fora\",\"points\":[{\"x\":0,\"y\":0},{\"x\":5000,\"y\":0}]}").andExpect(status().isBadRequest());
        send(post("/map/routes"), player, "{\"points\":[{\"x\":0,\"y\":0},{\"x\":9,\"y\":9}]}").andExpect(jsonPath("$.name").value("Trajetória"));
        for (int i = 0; i < 4; i++) send(post("/map/routes"), player, ROUTE).andExpect(status().isCreated());
        send(post("/map/routes"), player, ROUTE).andExpect(status().isBadRequest());
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String login(String username) throws Exception {
        String body = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + username + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }
}
