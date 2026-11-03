package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.OfficialPlaces;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Lugares do mapa oficial: nascem escondidos, o mestre liga e desliga (um a um ou por região) e ninguém os apaga.
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "runarcana.official-places.seed=true")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OfficialPlacesTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void ocatalogoTemChavesUnicasEFicaDentroDoMapa() {
        assertThat(new HashSet<>(OfficialPlaces.ALL.stream().map(OfficialPlaces.Place::key).toList())).hasSameSizeAs(OfficialPlaces.ALL);
        assertThat(OfficialPlaces.ALL).allSatisfy(p -> {
            assertThat(Math.abs(p.x())).isLessThanOrEqualTo(1024);
            assertThat(Math.abs(p.y())).isLessThanOrEqualTo(1024);
        });
        assertThat(OfficialPlaces.ALL).anyMatch(p -> p.name().equals("O Disco Solar"));
        assertThat(OfficialPlaces.ALL).anyMatch(p -> p.name().equals("Monte Targon"));
        assertThat(OfficialPlaces.ALL).hasSize(8);
    }

    @Test
    void osLugaresOficiaisNascemEscondidosEOMestreLigaEDesliga() throws Exception {
        String master = login("mestre");
        String player = login("rudo");
        mvc.perform(get("/map/pois").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/map/pois").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.length()").value(OfficialPlaces.ALL.size()))
                .andExpect(jsonPath("$[0].official").value(true));

        send(patch("/map/pois/official/audience"), player, "{\"region\":\"shurima\",\"toAll\":true}").andExpect(status().isForbidden());
        long shurima = OfficialPlaces.ALL.stream().filter(p -> p.region().equals("shurima")).count();
        send(patch("/map/pois/official/audience"), master, "{\"region\":\"shurima\",\"toAll\":true}").andExpect(jsonPath("$.changed").value(shurima));
        mvc.perform(get("/map/pois").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.length()").value(shurima))
                .andExpect(jsonPath("$[?(@.name=='O Disco Solar')]").exists());
        // Ligar de novo não muda nada; desligar tudo esconde de volta.
        send(patch("/map/pois/official/audience"), master, "{\"region\":\"shurima\",\"toAll\":true}").andExpect(jsonPath("$.changed").value(0));
        send(patch("/map/pois/official/audience"), master, "{\"toAll\":false}").andExpect(jsonPath("$.changed").value(shurima));
        mvc.perform(get("/map/pois").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void ninguemApagaUmLugarOficial() throws Exception {
        String master = login("mestre");
        String body = mvc.perform(get("/map/pois").header("Authorization", "Bearer " + master)).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        mvc.perform(delete("/map/pois/" + m.group(1)).header("Authorization", "Bearer " + master)).andExpect(status().isBadRequest());
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String login(String username) throws Exception {
        String body = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + username + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }
}
