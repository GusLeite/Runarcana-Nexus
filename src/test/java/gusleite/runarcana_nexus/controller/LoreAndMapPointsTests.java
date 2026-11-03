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
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LoreAndMapPointsTests {

    private static final String AZIR = "{\"kind\":\"CHARACTER\",\"name\":\"Azir\",\"subtitle\":\"O Imperador das Areias\",\"toAll\":false,\"recipients\":[],"
            + "\"facts\":[{\"label\":\"Função\",\"value\":\"Mago\"}],"
            + "\"sections\":[{\"title\":\"Boato\",\"body\":\"Dizem que voltou.\",\"toAll\":true,\"recipients\":[]},"
            + "{\"title\":\"Segredo\",\"body\":\"Foi traído por Xerath.\",\"toAll\":false,\"recipients\":[\"rudo\"]},"
            + "{\"title\":\"Rascunho\",\"body\":\"Só o mestre.\",\"toAll\":false,\"recipients\":[]}]}";

    private static final String POI = "{\"name\":\"Ruínas\",\"kind\":\"MYSTERY\",\"x\":10,\"y\":-20,\"toAll\":true,\"recipients\":[]}";

    @Autowired
    private MockMvc mvc;

    @Test
    void soOMestreEscreveNaLore() throws Exception {
        send(post("/lore"), login("gaudron"), AZIR).andExpect(status().isForbidden());
        mvc.perform(get("/lore")).andExpect(status().isUnauthorized());
    }

    @Test
    void cadaPersonagemRecebeSoOQueConhece() throws Exception {
        String master = login("mestre");
        send(post("/lore"), master, AZIR).andExpect(status().isCreated())
                .andExpect(jsonPath("$.sections", hasSize(3)));

        read("/lore", login("rudo"))
                .andExpect(jsonPath("$[0].name").value("Azir"))
                .andExpect(jsonPath("$[0].sections", hasSize(2)))
                .andExpect(jsonPath("$[0].sections[1].title").value("Segredo"))
                .andExpect(jsonPath("$[0].recipients").doesNotExist())
                .andExpect(jsonPath("$[0].sections[1].recipients").doesNotExist());

        read("/lore", login("gaudron"))
                .andExpect(jsonPath("$[0].sections", hasSize(1)))
                .andExpect(jsonPath("$[0].sections[0].title").value("Boato"));
    }

    @Test
    void verbeteSemNadaLiberadoFicaEscondido() throws Exception {
        String master = login("mestre");
        send(post("/lore"), master, "{\"kind\":\"PLACE\",\"name\":\"Nashramae\",\"toAll\":false,\"recipients\":[]}").andExpect(status().isCreated());
        read("/lore", login("rudo")).andExpect(jsonPath("$", hasSize(0)));
        read("/lore", master).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void regiaoVinculaPersonagensELugares() throws Exception {
        String master = login("mestre");
        long azir = id(send(post("/lore"), master, AZIR));
        long hidden = id(send(post("/lore"), master, "{\"kind\":\"PLACE\",\"name\":\"Oculto\",\"toAll\":false,\"recipients\":[]}"));
        long region = id(send(post("/lore"), master, "{\"kind\":\"REGION\",\"name\":\"Shurima\",\"mapSlug\":\"shurima\",\"toAll\":true,\"recipients\":[],"
                + "\"linkedIds\":[" + azir + "," + hidden + "]}"));

        // O jogador não fica sabendo do lugar que não conhece.
        read("/lore", login("gaudron"))
                .andExpect(jsonPath("$[1].name").value("Shurima"))
                .andExpect(jsonPath("$[1].linked", hasSize(1)))
                .andExpect(jsonPath("$[1].linked[0].name").value("Azir"))
                .andExpect(jsonPath("$[0].region.id").value(region));

        send(put("/lore/" + region), master, "{\"kind\":\"REGION\",\"name\":\"Shurima\",\"toAll\":true,\"recipients\":[],\"linkedIds\":[]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linked", hasSize(0)));
    }

    @Test
    void apagarRegiaoSoDesfazOVinculo() throws Exception {
        String master = login("mestre");
        long region = id(send(post("/lore"), master, "{\"kind\":\"REGION\",\"name\":\"Shurima\",\"toAll\":true,\"recipients\":[]}"));
        send(post("/lore"), master, "{\"kind\":\"PLACE\",\"name\":\"Nashramae\",\"toAll\":true,\"recipients\":[],\"regionId\":" + region + "}")
                .andExpect(status().isCreated());
        send(post("/map/pois"), master, "{\"name\":\"X\",\"kind\":\"CITY\",\"x\":0,\"y\":0,\"toAll\":true,\"recipients\":[],\"loreEntryId\":" + region + "}")
                .andExpect(status().isCreated());
        mvc.perform(delete("/lore/" + region).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
        read("/lore", master).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].region").doesNotExist());
        read("/map/pois", master).andExpect(jsonPath("$[0].loreEntryId").doesNotExist());
    }

    @Test
    void soOMestreCriaPontoEOOcultoNaoChegaAoJogador() throws Exception {
        String player = login("rudo");
        send(post("/map/pois"), player, POI).andExpect(status().isForbidden());
        String master = login("mestre");
        long hidden = id(send(post("/map/pois"), master, "{\"name\":\"Oculto\",\"kind\":\"DANGER\",\"x\":0,\"y\":0,\"toAll\":false,\"recipients\":[\"gaudron\"]}"));
        send(post("/map/pois"), master, POI).andExpect(status().isCreated());

        read("/map/pois", player).andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].name").value("Ruínas"));
        read("/map/pois", login("gaudron")).andExpect(jsonPath("$", hasSize(2)));
        send(post("/map/pois/" + hidden + "/comments"), player, "{\"text\":\"oi\",\"shared\":true}").andExpect(status().isNotFound());
    }

    @Test
    void pontoForaDoMapaEhRecusado() throws Exception {
        send(post("/map/pois"), login("mestre"), "{\"name\":\"X\",\"kind\":\"CITY\",\"x\":5000,\"y\":0,\"toAll\":true,\"recipients\":[]}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void anotacaoEhPrivadaEComentarioEhDaMesa() throws Exception {
        String master = login("mestre");
        long poi = id(send(post("/map/pois"), master, POI));
        String rudo = login("rudo");
        String gaudron = login("gaudron");
        send(post("/map/pois/" + poi + "/comments"), rudo, "{\"text\":\"Minha anotação\",\"shared\":false}").andExpect(status().isCreated());
        long shared = id(send(post("/map/pois/" + poi + "/comments"), rudo, "{\"text\":\"Cuidado aqui\",\"shared\":true}"));

        read("/map/pois", rudo).andExpect(jsonPath("$[0].comments", hasSize(2)));
        read("/map/pois", gaudron).andExpect(jsonPath("$[0].comments", hasSize(1)))
                .andExpect(jsonPath("$[0].comments[0].text").value("Cuidado aqui"))
                .andExpect(jsonPath("$[0].comments[0].mine").value(false));
        read("/map/pois", master).andExpect(jsonPath("$[0].comments", hasSize(1)));

        mvc.perform(delete("/map/pois/comments/" + shared).header("Authorization", "Bearer " + gaudron)).andExpect(status().isNotFound());
        mvc.perform(delete("/map/pois/comments/" + shared).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
    }

    @Test
    void cadaJogadorTemAte3WaypointsPrivados() throws Exception {
        String rudo = login("rudo");
        String body = "{\"name\":\"Base\",\"comment\":\"Voltar aqui\",\"x\":1,\"y\":2}";
        long first = id(send(post("/map/waypoints"), rudo, body));
        send(post("/map/waypoints"), rudo, body).andExpect(status().isCreated());
        send(post("/map/waypoints"), rudo, body).andExpect(status().isCreated());
        send(post("/map/waypoints"), rudo, body).andExpect(status().isBadRequest());

        String gaudron = login("gaudron");
        read("/map/waypoints", gaudron).andExpect(jsonPath("$", hasSize(0)));
        send(put("/map/waypoints/" + first), gaudron, body).andExpect(status().isNotFound());
        read("/map/waypoints", login("mestre")).andExpect(jsonPath("$", hasSize(3))).andExpect(jsonPath("$[0].owner").value("rudo"));

        mvc.perform(delete("/map/waypoints/" + first).header("Authorization", "Bearer " + rudo)).andExpect(status().isNoContent());
        send(post("/map/waypoints"), rudo, body).andExpect(status().isCreated());
    }

    @Test
    void mestreNaoCriaWaypoint() throws Exception {
        send(post("/map/waypoints"), login("mestre"), "{\"name\":\"X\",\"x\":0,\"y\":0}").andExpect(status().isBadRequest());
    }

    private ResultActions read(String path, String token) throws Exception {
        return mvc.perform(get(path).header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private long id(ResultActions actions) throws Exception {
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(actions.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
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
