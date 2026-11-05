package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// "Olhem aqui!" e ping no mapa: eventos com dados pelo canal ao vivo, só para quem pode ver.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MapSignalTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void soOMestreChamaAtencaoEOJogadorRecebe() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        MvcResult stream = open(rudo);
        send(post("/map/focus"), rudo, "{\"x\":10,\"y\":20}").andExpect(status().isForbidden());
        send(post("/map/focus"), master, "{\"x\":2000,\"y\":0}").andExpect(status().isBadRequest());
        send(post("/map/focus"), master, "{\"x\":10}").andExpect(status().isBadRequest());
        send(post("/map/focus"), master, "{\"x\":10,\"y\":-20}").andExpect(status().isOk()).andExpect(jsonPath("$.sentTo").value(1));
        String events = stream.getResponse().getContentAsString();
        assertThat(events).contains("event:map-focus", "\"x\":10", "\"y\":-20", "\"from\":\"mestre\"");
        // Sinal não é alteração: as telas não precisam buscar o mapa de novo.
        assertThat(events).doesNotContain("\"topic\":\"map\"");
    }

    @Test
    void pontoOcultoSoVaiParaQuemOVe() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        String gaudron = login("gaudron");
        long poi = id(send(post("/map/pois"), master, "{\"name\":\"Cripta\",\"kind\":\"DUNGEON\",\"x\":100,\"y\":50,\"toAll\":false,\"recipients\":[\"rudo\"]}"));
        MvcResult toRudo = open(rudo);
        MvcResult toGaudron = open(gaudron);
        send(post("/map/focus"), master, "{\"poiId\":" + poi + "}").andExpect(jsonPath("$.sentTo").value(1));
        assertThat(toRudo.getResponse().getContentAsString()).contains("event:map-focus", "\"poiId\":" + poi, "\"name\":\"Cripta\"");
        assertThat(toGaudron.getResponse().getContentAsString()).doesNotContain("map-focus");
        send(post("/map/focus"), master, "{\"poiId\":999}").andExpect(status().isNotFound());
    }

    @Test
    void pingVaiParaTodosComLimite() throws Exception {
        String rudo = login("rudo");
        MvcResult toMaster = open(login("mestre"));
        mvc.perform(post("/map/ping").contentType(MediaType.APPLICATION_JSON).content("{\"x\":1,\"y\":1}")).andExpect(status().isUnauthorized());
        for (int i = 0; i < 3; i++) send(post("/map/ping"), rudo, "{\"x\":" + i + ",\"y\":5}").andExpect(status().isOk());
        send(post("/map/ping"), rudo, "{\"x\":9,\"y\":5}").andExpect(status().isTooManyRequests());
        assertThat(toMaster.getResponse().getContentAsString()).contains("event:map-ping", "\"from\":\"rudo\"", "\"who\":\"rudo\"", "\"x\":2");
    }

    private MvcResult open(String token) throws Exception {
        String ticket = text(mvc.perform(post("/live/ticket").header("Authorization", "Bearer " + token)), "ticket");
        return mvc.perform(get("/live/stream").param("ticket", ticket)).andExpect(request().asyncStarted()).andReturn();
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String token, String body) throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static long id(ResultActions actions) throws Exception {
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(actions.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private static String text(ResultActions actions, String field) throws Exception {
        Matcher m = Pattern.compile("\"" + field + "\":\"([^\"]+)\"").matcher(actions.andReturn().getResponse().getContentAsString());
        assertThat(m.find()).isTrue();
        return m.group(1);
    }

    private String login(String username) throws Exception {
        return text(mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\"" + username + "\"}")), "token");
    }
}
