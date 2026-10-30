package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Inventário, ouro e inspiração da ficha pronta (catálogo de teste: itens-teste.json). O Nyx nasce com Couro, 2 Adagas,
// 5 Tochas (consumíveis) e a Caixa de esmolas do Conjunto Teste.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class InventoryControllerTests {

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

    @Test
    void soOMestreMexeNoInventario() throws Exception {
        long id = createNyx();
        String player = login("gaudron");
        mvc.perform(get("/character/" + id + "/items").header("Authorization", "Bearer " + player)).andExpect(status().isForbidden());
        send(post("/character/" + id + "/items"), player, "{\"catalogId\":\"t-tocha\"}").andExpect(status().isForbidden());
        send(patch("/character/" + id + "/gold"), player, "{\"gold\":999}").andExpect(status().isForbidden());
        send(patch("/character/" + id + "/inspiration"), player, "{\"inspiration\":true}").andExpect(status().isForbidden());
        mvc.perform(get("/character/999/items").header("Authorization", "Bearer " + login("mestre"))).andExpect(status().isNotFound());
    }

    @Test
    void mestreDaETiraItens() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        mvc.perform(get("/character/" + id + "/items").header("Authorization", "Bearer " + master))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.characterName").value("Nyx"))
                .andExpect(jsonPath("$.items[?(@.name == 'Tocha Teste')].quantity").value(5))
                .andExpect(jsonPath("$.items[?(@.name == 'Tocha Teste')].kind").value("CONSUMABLE"));
        // Item que já tem soma na mesma linha; conjunto entra aberto.
        send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"t-tocha\",\"quantity\":2}")
                .andExpect(jsonPath("$.items[?(@.name == 'Tocha Teste')].quantity").value(7));
        send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"t-conjunto\"}")
                .andExpect(jsonPath("$.items[?(@.name == 'Tocha Teste')].quantity").value(12));
        send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"nao-existe\"}").andExpect(status().isBadRequest());
        send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"t-tocha\",\"quantity\":0}").andExpect(status().isBadRequest());
        // Loot fora do catálogo.
        String loot = send(post("/character/" + id + "/items/custom"), master,
                        "{\"name\":\"Elixir de Shurima\",\"description\":\"Brilha.\",\"weight\":0.5,\"price\":50,\"rarity\":\"Rare\",\"quantity\":2,\"consumable\":true}")
                .andExpect(jsonPath("$.items[?(@.name == 'Elixir de Shurima')].kind").value("CONSUMABLE"))
                .andExpect(jsonPath("$.items[?(@.name == 'Elixir de Shurima')].rarity").value("Rare"))
                .andReturn().getResponse().getContentAsString();
        send(post("/character/" + id + "/items/custom"), master, "{\"name\":\" \"}").andExpect(status().isBadRequest());
        long elixir = entryId(loot, "Elixir de Shurima");
        send(patch("/character/" + id + "/items/" + elixir), master, "{\"quantity\":5}")
                .andExpect(jsonPath("$.items[?(@.name == 'Elixir de Shurima')].quantity").value(5));
        send(patch("/character/" + id + "/items/" + elixir), master, "{\"quantity\":-1}").andExpect(status().isBadRequest());
        send(patch("/character/" + id + "/items/" + elixir), master, "{\"quantity\":0}")
                .andExpect(jsonPath("$.items[?(@.name == 'Elixir de Shurima')]").isEmpty());
        mvc.perform(delete("/character/" + id + "/items/" + elixir).header("Authorization", "Bearer " + master)).andExpect(status().isNotFound());
    }

    @Test
    void escudoRemovidoSaiDaCa() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        String player = login("gaudron");
        String body = send(post("/character/" + id + "/items"), master, "{\"catalogId\":\"t-escudo\"}")
                .andReturn().getResponse().getContentAsString();
        long shield = entryId(body, "Escudo Teste");
        send(patch("/character/me/shield"), player, "{\"key\":\"ITEM:" + shield + "\"}")
                .andExpect(jsonPath("$.shield").value("ITEM:" + shield));
        mvc.perform(delete("/character/" + id + "/items/" + shield).header("Authorization", "Bearer " + master)).andExpect(status().isOk());
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.armorClass.shield").doesNotExist())
                .andExpect(jsonPath("$.armorClass.shields").isEmpty());
    }

    @Test
    void ouroEInspiracao() throws Exception {
        long id = createNyx();
        String master = login("mestre");
        String player = login("gaudron");
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":-1}").andExpect(status().isBadRequest());
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":30}").andExpect(jsonPath("$.gold").value(30));
        send(patch("/character/" + id + "/inspiration"), master, "{\"inspiration\":true}").andExpect(jsonPath("$.inspiration").value(true));

        // O jogador gasta: ouro até o que tem, a inspiração acesa uma vez.
        send(post("/character/me/gold/spend"), player, "{\"amount\":31}").andExpect(status().isBadRequest());
        send(post("/character/me/gold/spend"), player, "{\"amount\":0}").andExpect(status().isBadRequest());
        send(post("/character/me/gold/spend"), player, "{\"amount\":12}").andExpect(jsonPath("$.character.gold").value(18));
        send(post("/character/me/inspiration/use"), player, "").andExpect(jsonPath("$.character.inspiration").value(0));
        send(post("/character/me/inspiration/use"), player, "").andExpect(status().isBadRequest());
    }

    @Test
    void jogadorUsaConsumivel() throws Exception {
        createNyx();
        String player = login("gaudron");
        String sheet = mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andReturn().getResponse().getContentAsString();
        long torch = entryId(sheet, "Tocha Teste");
        long dagger = entryId(sheet, "Adaga Teste");
        send(post("/character/me/items/" + torch + "/use"), player, "")
                .andExpect(jsonPath("$.inventory[?(@.name == 'Tocha Teste')].quantity").value(4));
        send(post("/character/me/items/" + dagger + "/use"), player, "").andExpect(status().isBadRequest());
        // Item de outra ficha não é dele.
        long other = create("rudo", NYX.replace("Nyx", "Rudo"));
        String otherSheet = mvc.perform(get("/character/" + other + "/items").header("Authorization", "Bearer " + login("mestre")))
                .andReturn().getResponse().getContentAsString();
        send(post("/character/me/items/" + entryId(otherSheet, "Tocha Teste") + "/use"), player, "").andExpect(status().isNotFound());
        // A última unidade tira a linha.
        for (int i = 0; i < 4; i++) send(post("/character/me/items/" + torch + "/use"), player, "").andExpect(status().isOk());
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.inventory[?(@.name == 'Tocha Teste')]").isEmpty());
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // id da linha do inventário pelo nome do item, num JSON com {"id":N,"name":"..."}.
    private static long entryId(String json, String name) {
        Matcher m = Pattern.compile("\"id\":(\\d+),\"name\":\"" + Pattern.quote(name) + "\"").matcher(json);
        assertThat(m.find()).as(name).isTrue();
        return Long.parseLong(m.group(1));
    }

    private long createNyx() throws Exception {
        return create("gaudron", NYX);
    }

    private long create(String username, String body) throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login(username))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(created);
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
