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
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Rolagens sorteadas no servidor: limites, vantagem, quem vê o quê e aviso no canal ao vivo.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class RollControllerTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void exigeLogin() throws Exception {
        mvc.perform(get("/rolls")).andExpect(status().isUnauthorized());
        mvc.perform(post("/rolls").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
    }

    @Test
    void testeDeD20ComVantagemFicaComOMaior() throws Exception {
        String rudo = login("rudo");
        for (int i = 0; i < 20; i++) {
            roll(rudo, "{\"label\":\"Atletismo\",\"kind\":\"CHECK\",\"mod\":3,\"mode\":\"adv\"}")
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.who").value("rudo"))
                    .andExpect(jsonPath("$.mine").value(true))
                    .andExpect(jsonPath("$.d20", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(20))))
                    .andExpect(jsonPath("$.other", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(20))))
                    .andExpect(result -> {
                        String body = result.getResponse().getContentAsString();
                        int d20 = number(body, "d20"), other = number(body, "other"), total = number(body, "total");
                        assertThat(d20).isGreaterThanOrEqualTo(other);
                        assertThat(total).isEqualTo(d20 + 3);
                    });
        }
        roll(rudo, "{\"label\":\"Furtividade\",\"kind\":\"CHECK\",\"mod\":0,\"mode\":\"dis\"}")
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertThat(number(body, "d20")).isLessThanOrEqualTo(number(body, "other"));
                });
    }

    @Test
    void dadosSomamOsDadosEOBonus() throws Exception {
        roll(login("rudo"), "{\"label\":\"Machado · dano\",\"kind\":\"DICE\",\"expr\":\" 3d6 - 2 \"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expr").value("3d6-2"))
                .andExpect(jsonPath("$.count").value(3))
                .andExpect(jsonPath("$.sides").value(6))
                .andExpect(jsonPath("$.bonus").value(-2))
                .andExpect(jsonPath("$.rolls", hasSize(3)))
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    Matcher m = Pattern.compile("\"rolls\":\\[(\\d+),(\\d+),(\\d+)]").matcher(body);
                    assertThat(m.find()).isTrue();
                    int sum = Integer.parseInt(m.group(1)) + Integer.parseInt(m.group(2)) + Integer.parseInt(m.group(3));
                    assertThat(number(body, "total")).isEqualTo(sum - 2);
                });
    }

    @Test
    void recusaRolagemForaDosLimites() throws Exception {
        String rudo = login("rudo");
        roll(rudo, "{\"label\":\" \",\"kind\":\"CHECK\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"OUTRO\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"CHECK\",\"mod\":500}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"CHECK\",\"mode\":\"sorte\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"CHECK\",\"critRange\":1}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"DICE\",\"expr\":\"101d6\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"DICE\",\"expr\":\"1d1\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"DICE\",\"expr\":\"bola de fogo\"}").andExpect(status().isBadRequest());
        roll(rudo, "{\"label\":\"x\",\"kind\":\"CHECK\",\"visibility\":\"NINGUEM\"}").andExpect(status().isBadRequest());
    }

    @Test
    void rolagemSecretaSoMostraOsNumerosAQuemRolouEAoMestre() throws Exception {
        String rudo = login("rudo");
        String master = login("mestre");
        roll(rudo, "{\"label\":\"Intuição\",\"kind\":\"CHECK\",\"visibility\":\"PRIVATE\"}").andExpect(status().isCreated());
        roll(master, "{\"label\":\"Emboscada\",\"kind\":\"DICE\",\"expr\":\"1d20\",\"visibility\":\"PRIVATE\"}")
                .andExpect(jsonPath("$.who").value("Mestre"));
        roll(master, "{\"label\":\"Clima\",\"kind\":\"DICE\",\"expr\":\"1d6\"}").andExpect(status().isCreated());

        // O mais novo primeiro.
        mvc.perform(get("/rolls").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].label").value("Clima"))
                .andExpect(jsonPath("$[1].hidden").value(true))
                .andExpect(jsonPath("$[1].who").value("Mestre"))
                .andExpect(jsonPath("$[1].label").doesNotExist())
                .andExpect(jsonPath("$[1].total").doesNotExist())
                .andExpect(jsonPath("$[2].hidden").value(true))
                .andExpect(jsonPath("$[2].who").value("rudo"));
        mvc.perform(get("/rolls").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$[1].hidden").value(true))
                .andExpect(jsonPath("$[2].hidden").value(false))
                .andExpect(jsonPath("$[2].label").value("Intuição"));
        mvc.perform(get("/rolls").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$[*].hidden", everyItem(is(false))));
        mvc.perform(get("/rolls").param("limit", "1").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void avisaOCanalAoVivo() throws Exception {
        String rudo = login("rudo");
        String ticket = text(mvc.perform(post("/live/ticket").header("Authorization", "Bearer " + rudo)), "ticket");
        MvcResult stream = mvc.perform(get("/live/stream").param("ticket", ticket)).andExpect(request().asyncStarted()).andReturn();
        roll(login("mestre"), "{\"label\":\"Clima\",\"kind\":\"DICE\",\"expr\":\"1d6\"}").andExpect(status().isCreated());
        assertThat(stream.getResponse().getContentAsString()).contains("{\"topic\":\"rolls\"}");
    }

    private ResultActions roll(String token, String body) throws Exception {
        return mvc.perform(post("/rolls").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static int number(String json, String field) {
        Matcher m = Pattern.compile("\"" + field + "\":(-?\\d+)").matcher(json);
        assertThat(m.find()).as(field).isTrue();
        return Integer.parseInt(m.group(1));
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
