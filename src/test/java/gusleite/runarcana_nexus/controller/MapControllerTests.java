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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

    @Test
    void oMestreRevelaOPontoNaHora() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        String body = send(post("/map/pois"), master, "{\"name\":\"Ruína de Shurima\",\"kind\":\"MYSTERY\",\"x\":10,\"y\":-300,\"toAll\":false,\"recipients\":[]}")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        String id = m.group(1);
        mvc.perform(get("/map/pois/visible").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$").isEmpty());
        send(patch("/map/pois/" + id + "/audience"), player, "{\"toAll\":true}").andExpect(status().isForbidden());

        // A alguns: o diário não conta o nome; a todos: conta.
        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":false,\"recipients\":[\"gaudron\"]}")
                .andExpect(jsonPath("$.recipients[0]").value("gaudron"));
        mvc.perform(get("/map/pois/visible").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$[0].name").value("Ruína de Shurima"));
        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":true,\"recipients\":[]}").andExpect(jsonPath("$.toAll").value(true));
        // Já era de todos: salvar de novo não repete o aviso.
        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":true,\"recipients\":[]}").andExpect(status().isOk());
        mvc.perform(get("/journal").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].kind").value("PLACE"))
                .andExpect(jsonPath("$[0].title").value("Novo local revelado: Ruína de Shurima"))
                .andExpect(jsonPath("$[1].title").value("Novo local revelado a gaudron"));

        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":false,\"recipients\":[]}").andExpect(status().isOk());
        mvc.perform(get("/map/pois/visible").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void oPontoGuardaImagensENotasSecretas() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        String body = send(post("/map/pois"), master, "{\"name\":\"Porto Velho\",\"kind\":\"PORT\",\"x\":0,\"y\":0,\"secretNotes\":\"O capitão é um espião\",\"toAll\":false,\"recipients\":[]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.secretNotes").value("O capitão é um espião"))
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        String id = m.group(1);
        String img = "data:image/png;base64,iVBORw0KGgo=";

        send(post("/map/pois/" + id + "/images"), player, "{\"image\":\"" + img + "\"}").andExpect(status().isForbidden());
        send(post("/map/pois/" + id + "/images"), master, "{\"image\":\"javascript:alert(1)\"}").andExpect(status().isBadRequest());
        send(post("/map/pois/" + id + "/images"), master, "{\"image\":\"" + img + "\"}").andExpect(jsonPath("$.imageCount").value(1));
        send(post("/map/pois/" + id + "/images"), master, "{\"image\":\"https://exemplo.com/mapa.png\"}").andExpect(jsonPath("$.imageCount").value(2));

        // Escondido: o jogador não vê o ponto nem as imagens.
        mvc.perform(get("/map/pois/" + id + "/images").header("Authorization", "Bearer " + player)).andExpect(status().isNotFound());
        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":true,\"recipients\":[]}").andExpect(status().isOk());
        mvc.perform(get("/map/pois/" + id + "/images").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0]").value(img));
        // As notas secretas só chegam ao mestre.
        mvc.perform(get("/map/pois").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$[0].secretNotes").doesNotExist())
                .andExpect(jsonPath("$[0].imageCount").value(2))
                .andExpect(jsonPath("$[0].spotlightRev").value(0));

        // Mostrar à mesa sobe a revisão; apagar uma imagem limpa o destaque.
        send(post("/map/pois/" + id + "/spotlight"), player, "{\"index\":1}").andExpect(status().isForbidden());
        send(post("/map/pois/" + id + "/spotlight"), master, "{\"index\":5}").andExpect(status().isNotFound());
        send(post("/map/pois/" + id + "/spotlight"), master, "{\"index\":1}").andExpect(jsonPath("$.spotlight").value(1)).andExpect(jsonPath("$.spotlightRev").value(1));
        send(post("/map/pois/" + id + "/spotlight"), master, "{\"index\":1}").andExpect(jsonPath("$.spotlightRev").value(2));
        mvc.perform(delete("/map/pois/" + id + "/images/0").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.imageCount").value(1))
                .andExpect(jsonPath("$.spotlight").doesNotExist());
    }

    @Test
    void oDiarioLigaEntradasAUmLocalEOPontoMostraOHistorico() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        String body = send(post("/map/pois"), master, "{\"name\":\"Torre Caída\",\"kind\":\"RUIN\",\"x\":200,\"y\":200,\"toAll\":false,\"recipients\":[]}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        String id = m.group(1);

        // Escondido: o jogador não cita o ponto e não lê o histórico.
        send(post("/journal"), player, "{\"title\":\"Vimos algo\",\"poiId\":" + id + "}").andExpect(status().isBadRequest());
        mvc.perform(get("/map/pois/" + id + "/history").header("Authorization", "Bearer " + player)).andExpect(status().isNotFound());
        send(post("/journal"), master, "{\"title\":\"Preparar a torre\",\"poiId\":" + id + "}").andExpect(jsonPath("$.poiName").value("Torre Caída"));
        mvc.perform(get("/journal").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$[0].title").value("Preparar a torre"))
                .andExpect(jsonPath("$[0].poiId").doesNotExist())
                .andExpect(jsonPath("$[0].poiName").doesNotExist());

        // Revelado: o evento PLACE já nasce ligado, e o jogador escreve sobre o local.
        send(patch("/map/pois/" + id + "/audience"), master, "{\"toAll\":true,\"recipients\":[]}").andExpect(status().isOk());
        send(post("/journal"), player, "{\"title\":\"Achamos um corpo\",\"poiId\":" + id + "}").andExpect(jsonPath("$.poiId").value(Integer.parseInt(id)));
        send(put("/map/party"), master, "{\"x\":210,\"y\":190,\"label\":\"Acampamos\"}").andExpect(status().isOk());
        send(put("/map/party"), master, "{\"x\":-600,\"y\":0,\"label\":\"Longe\"}").andExpect(status().isOk());
        mvc.perform(get("/map/pois/" + id + "/history").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.entries.length()").value(3))
                .andExpect(jsonPath("$.entries[0].title").value("Achamos um corpo"))
                .andExpect(jsonPath("$.entries[1].kind").value("PLACE"))
                .andExpect(jsonPath("$.stops.length()").value(1))
                .andExpect(jsonPath("$.stops[0].label").value("Acampamos"));

        // Apagar o ponto não apaga o diário.
        mvc.perform(delete("/map/pois/" + id).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
        mvc.perform(get("/journal").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$[0].title").value("Achamos um corpo"))
                .andExpect(jsonPath("$[0].poiId").doesNotExist());
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
