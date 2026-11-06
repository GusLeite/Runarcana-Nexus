package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.services.WorkbenchService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Bancada de fabricação (formulas-teste.json): o Nyx tem Ferraria; sabe as de nível 0, o Ábaco (Fórmula Geral que cita
// Ferraria) e o que o mestre marcar. O d20 é fixado em cada teste.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class WorkbenchControllerTests {

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

    @Autowired
    private WorkbenchService workbench;

    @AfterEach
    void unfix() {
        workbench.setRandom(new Random());
    }

    @Test
    void receitasDaFicha() throws Exception {
        long id = create();
        String player = login("gaudron");
        String master = login("mestre");
        mvc.perform(get("/character/me/workbench").header("Authorization", "Bearer " + player))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipes[?(@.key == 'ferraria:pregos-0')].craftable").value(true))
                .andExpect(jsonPath("$.recipes[?(@.key == 'general:abaco')].craftName").value("Ferraria"))
                .andExpect(jsonPath("$.recipes[?(@.key == 'general:ninguem')]").isEmpty())
                .andExpect(jsonPath("$.recipes[?(@.key == 'ferraria:criar-arma-1')]").isEmpty())
                .andExpect(jsonPath("$.recipes[?(@.key == 'ferraria:variavel-0')].craftable").value(false));
        send(put("/character/" + id + "/formulas"), master, "{\"formulas\":[\"ferraria:criar-arma-1\"]}").andExpect(status().isOk());
        mvc.perform(get("/character/me/workbench").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.recipes[?(@.key == 'ferraria:criar-arma-1')].dcs[0]").value(13))
                .andExpect(jsonPath("$.recipes[?(@.key == 'ferraria:criar-arma-1')].values[2]").value(50));
    }

    @Test
    void fabricaPagaEEntregaNaMochila() throws Exception {
        long id = create();
        String player = login("gaudron");
        String master = login("mestre");
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":10}").andExpect(status().isOk());

        // Sucesso: paga metade do valor (3 PO -> 2) e os Pregos vão para a mochila.
        fix(10);
        craft(player, "{\"key\":\"ferraria:pregos-0\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("SUCCESS"))
                .andExpect(jsonPath("$.cost").value(2))
                .andExpect(jsonPath("$.d20").value(10))
                .andExpect(jsonPath("$.sheet.character.gold").value(8))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Pregos')].quantity").value(1));
        craft(player, "{\"key\":\"ferraria:pregos-0\"}")
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Pregos')].quantity").value(2));

        // 20 natural: Obra-prima, item à parte.
        fix(20);
        craft(player, "{\"key\":\"general:abaco\"}")
                .andExpect(jsonPath("$.outcome").value("MASTERWORK"))
                .andExpect(jsonPath("$.item").value("Ábaco (Obra-prima)"))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Ábaco (Obra-prima)')].rarity").value("Uncommon"));

        // 1 natural: os materiais se perdem.
        fix(1);
        craft(player, "{\"key\":\"ferraria:pregos-0\"}")
                .andExpect(jsonPath("$.outcome").value("RUINED"))
                .andExpect(jsonPath("$.refund").value(0))
                .andExpect(jsonPath("$.sheet.character.gold").value(3));

        // Recusas: sem ouro, fórmula desconhecida, variável, grau inválido.
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":1}").andExpect(status().isOk());
        craft(player, "{\"key\":\"ferraria:pregos-0\"}").andExpect(status().isBadRequest());
        craft(player, "{\"key\":\"ferraria:criar-arma-1\"}").andExpect(status().isBadRequest());
        craft(player, "{\"key\":\"ferraria:variavel-0\"}").andExpect(status().isBadRequest());
        craft(player, "{\"key\":\"general:abaco\",\"tier\":3}").andExpect(status().isBadRequest());

        // Fórmula com graus: CD e valor do grau escolhido; falha por pouco devolve metade dos materiais.
        send(put("/character/" + id + "/formulas"), master, "{\"formulas\":[\"ferraria:criar-arma-1\"]}").andExpect(status().isOk());
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":100}").andExpect(status().isOk());
        String bench = mvc.perform(get("/character/me/workbench").header("Authorization", "Bearer " + player))
                .andReturn().getResponse().getContentAsString();
        Matcher bonus = Pattern.compile("\"key\":\"ferraria:criar-arma-1\".*?\"bonus\":(-?\\d+)").matcher(bench);
        assertThat(bonus.find()).isTrue();
        int b = Integer.parseInt(bonus.group(1));
        fix(13 - b - 1); // grau 3: CD 13 (a única), valor 50; falha por 1
        craft(player, "{\"key\":\"ferraria:criar-arma-1\",\"tier\":2}")
                .andExpect(jsonPath("$.dc").value(13))
                .andExpect(jsonPath("$.outcome").value("FAILED"))
                .andExpect(jsonPath("$.cost").value(25))
                .andExpect(jsonPath("$.refund").value(12))
                .andExpect(jsonPath("$.sheet.character.gold").value(87));
    }

    private void fix(int d20) {
        workbench.setRandom(new Random() {
            @Override
            public int nextInt(int origin, int bound) {
                return d20;
            }
        });
    }

    private ResultActions craft(String token, String body) throws Exception {
        return send(post("/character/me/workbench/craft"), token, body);
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private long create() throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login("gaudron"))
                        .contentType(MediaType.APPLICATION_JSON).content(NYX))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(created);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

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
