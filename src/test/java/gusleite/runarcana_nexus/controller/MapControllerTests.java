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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
