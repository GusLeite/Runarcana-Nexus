package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.config.LiveConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Canal ao vivo (SSE): ticket de uso único e avisos por tópico depois das alterações.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LiveControllerTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void ticketExigeLoginEValeUmaVezSo() throws Exception {
        mvc.perform(post("/live/ticket")).andExpect(status().isUnauthorized());
        mvc.perform(get("/live/stream")).andExpect(status().isUnauthorized());
        mvc.perform(get("/live/stream").param("ticket", "inventado")).andExpect(status().isUnauthorized());

        String ticket = ticket(login("rudo"));
        mvc.perform(get("/live/stream").param("ticket", ticket)).andExpect(request().asyncStarted());
        mvc.perform(get("/live/stream").param("ticket", ticket)).andExpect(status().isUnauthorized());
    }

    @Test
    void avisaOTopicoDepoisDeUmaAlteracao() throws Exception {
        String rudo = login("rudo");
        String master = login("mestre");
        MvcResult stream = mvc.perform(get("/live/stream").param("ticket", ticket(rudo)))
                .andExpect(request().asyncStarted()).andReturn();
        assertThat(stream.getResponse().getContentAsString()).contains("event:hello");

        // Leitura não avisa; erro também não.
        mvc.perform(get("/journal").header("Authorization", "Bearer " + rudo)).andExpect(status().isOk());
        mvc.perform(post("/journal").header("Authorization", "Bearer " + master)
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\" \",\"body\":\"\"}")).andExpect(status().isBadRequest());
        assertThat(stream.getResponse().getContentAsString()).doesNotContain("event:change");

        mvc.perform(post("/journal").header("Authorization", "Bearer " + master)
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Lembrete do mestre\"}")).andExpect(status().isCreated());
        assertThat(stream.getResponse().getContentAsString()).contains("event:change", "{\"topic\":\"journal\"}");

        // Anotação é privada: não vira aviso.
        mvc.perform(post("/notes").header("Authorization", "Bearer " + rudo)
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Segredo\",\"body\":\"x\"}"));
        assertThat(stream.getResponse().getContentAsString()).doesNotContain("\"topic\":\"notes\"");
    }

    @Test
    void topicoPeloPrimeiroTrechoDaRota() {
        assertThat(LiveConfig.topicOf("/map/pois/3/audience")).isEqualTo("map");
        assertThat(LiveConfig.topicOf("/character/7/gold")).isEqualTo("table");
        assertThat(LiveConfig.topicOf("/merchants")).isEqualTo("merchants");
        assertThat(LiveConfig.topicOf("/auth/login")).isNull();
        assertThat(LiveConfig.topicOf("/notes/1")).isNull();
    }

    private String ticket(String token) throws Exception {
        String body = mvc.perform(post("/live/ticket").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"ticket\":\"([^\"]+)\"").matcher(body);
        assertThat(m.find()).isTrue();
        return m.group(1);
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
