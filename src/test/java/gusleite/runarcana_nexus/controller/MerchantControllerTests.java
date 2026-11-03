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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Mercador (catálogo de teste: itens-teste.json; Adaga 2 PO, Machado 10 PO). O Nyx nasce com 2 Adagas e 5 Tochas.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MerchantControllerTests {

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
    void soOMestreMontaALoja() throws Exception {
        String player = login("gaudron");
        mvc.perform(get("/merchants").header("Authorization", "Bearer " + player)).andExpect(status().isForbidden());
        send(post("/merchants"), player, "{\"name\":\"X\"}").andExpect(status().isForbidden());
        mvc.perform(get("/merchants/active/ping")).andExpect(status().isUnauthorized());

        String master = login("mestre");
        send(post("/merchants"), master, "{\"name\":\" \"}").andExpect(status().isBadRequest());
        send(post("/merchants"), master, "{\"name\":\"X\",\"buyRate\":101}").andExpect(status().isBadRequest());
        send(post("/merchants"), master, "{\"name\":\"X\",\"image\":\"javascript:alert(1)\"}").andExpect(status().isBadRequest());
        send(post("/merchants"), master, "{\"name\":\"X\",\"image\":\"data:image/svg+xml;base64,AAAA\"}").andExpect(status().isBadRequest());
        send(post("/merchants"), master, "{\"name\":\"X\",\"image\":\"data:image/webp;base64,AAAA\"}").andExpect(status().isCreated());
    }

    @Test
    void lojaSoApareceQuandoAberta() throws Exception {
        String master = login("mestre");
        String player = login("gaudron");
        long a = merchant(master, "Tobias");
        long b = merchant(master, "Zara");
        mvc.perform(get("/merchants/active/ping").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$.id").doesNotExist());
        mvc.perform(get("/merchants/active").header("Authorization", "Bearer " + player)).andExpect(status().isNotFound());

        send(post("/merchants/" + a + "/open"), master, "").andExpect(jsonPath("$.active").value(true));
        mvc.perform(get("/merchants/active/ping").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$.name").value("Tobias"));
        // Um por vez: abrir outro fecha o primeiro.
        send(post("/merchants/" + b + "/open"), master, "").andExpect(status().isOk());
        mvc.perform(get("/merchants/active/ping").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$.name").value("Zara"));
        send(post("/merchants/" + b + "/close"), master, "").andExpect(jsonPath("$.active").value(false));
        mvc.perform(get("/merchants/active/ping").header("Authorization", "Bearer " + player)).andExpect(jsonPath("$.id").doesNotExist());
        send(post("/merchants/active/buy"), player, "{\"lineId\":1,\"quantity\":1}").andExpect(status().isNotFound());
    }

    @Test
    void jogadorCompra() throws Exception {
        long id = create("gaudron");
        String master = login("mestre");
        String player = login("gaudron");
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":25}").andExpect(status().isOk());
        long m = merchant(master, "Tobias");
        send(post("/merchants/" + m + "/items"), master, "{\"catalogId\":\"nao-existe\"}").andExpect(status().isBadRequest());
        // Preço do catálogo por padrão, estoque limitado.
        String shop = send(post("/merchants/" + m + "/items"), master, "{\"catalogId\":\"t-machado\",\"stock\":2}")
                .andExpect(jsonPath("$.items[0].price").value(10))
                .andExpect(jsonPath("$.items[0].kind").value("WEAPON"))
                .andReturn().getResponse().getContentAsString();
        send(post("/merchants/" + m + "/items"), master, "{\"catalogId\":\"t-machado\"}").andExpect(status().isBadRequest());
        long axe = lineId(shop, "Machado Teste");
        send(post("/merchants/" + m + "/open"), master, "").andExpect(status().isOk());

        send(post("/merchants/active/buy"), player, "{\"lineId\":" + axe + ",\"quantity\":3}").andExpect(status().isBadRequest());
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + axe + ",\"quantity\":1,\"price\":9}").andExpect(status().isBadRequest());
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + axe + ",\"quantity\":2,\"price\":10}")
                .andExpect(jsonPath("$.sheet.character.gold").value(5))
                .andExpect(jsonPath("$.merchant.items[0].stock").value(0))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Machado Teste')].quantity").value(2));
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + axe + ",\"quantity\":1}").andExpect(status().isBadRequest());

        // Item livre, sem ouro que chegue: nada muda.
        String custom = send(post("/merchants/" + m + "/items"), master,
                        "{\"custom\":{\"name\":\"Elixir\",\"consumable\":true,\"rarity\":\"Rare\"},\"price\":6}")
                .andExpect(jsonPath("$.items[1].kind").value("CONSUMABLE"))
                .andReturn().getResponse().getContentAsString();
        long elixir = lineId(custom, "Elixir");
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + elixir + ",\"quantity\":1}").andExpect(status().isBadRequest());
        send(patch("/merchants/" + m + "/items/" + elixir), master, "{\"price\":5,\"stock\":null}").andExpect(status().isOk());
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + elixir + ",\"quantity\":1}")
                .andExpect(jsonPath("$.sheet.character.gold").value(0))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Elixir')].kind").value("CONSUMABLE"));

        // O mestre vê o movimento, mais novo primeiro.
        mvc.perform(get("/merchants/" + m + "/trades").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$[0].itemName").value("Elixir"))
                .andExpect(jsonPath("$[1].kind").value("BUY"))
                .andExpect(jsonPath("$[1].characterName").value("Nyx"))
                .andExpect(jsonPath("$[1].total").value(20));
    }

    @Test
    void jogadorVendeEOItemVaiParaAPrateleira() throws Exception {
        long id = create("gaudron");
        String master = login("mestre");
        String player = login("gaudron");
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":0}").andExpect(status().isOk());
        long m = merchant(master, "Tobias");
        send(post("/merchants/" + m + "/open"), master, "").andExpect(status().isOk());
        String sheet = mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andReturn().getResponse().getContentAsString();
        long dagger = lineId(sheet, "Adaga Teste");

        // Paga 50% de 2 PO; a oferta vem para o jogador.
        mvc.perform(get("/merchants/active").header("Authorization", "Bearer " + player))
                .andExpect(jsonPath("$.offers[?(@.entryId == " + dagger + ")].unitValue").value(1));
        send(post("/merchants/active/sell"), player, "{\"entryId\":" + dagger + ",\"quantity\":3}").andExpect(status().isBadRequest());
        send(post("/merchants/active/sell"), player, "{\"entryId\":" + dagger + ",\"quantity\":1,\"unitValue\":1}")
                .andExpect(jsonPath("$.sheet.character.gold").value(1))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Adaga Teste')].quantity").value(1))
                .andExpect(jsonPath("$.merchant.items[0].name").value("Adaga Teste"))
                .andExpect(jsonPath("$.merchant.items[0].price").value(2))
                .andExpect(jsonPath("$.merchant.items[0].stock").value(1));
        // A última unidade tira a linha e soma no estoque.
        send(post("/merchants/active/sell"), player, "{\"entryId\":" + dagger + ",\"quantity\":1}")
                .andExpect(jsonPath("$.sheet.character.gold").value(2))
                .andExpect(jsonPath("$.sheet.inventory[?(@.name == 'Adaga Teste')]").isEmpty())
                .andExpect(jsonPath("$.merchant.items[0].stock").value(2));

        // Item de outra ficha não é dele; e quem paga 0% não compra.
        create("rudo");
        String other = mvc.perform(get("/character/me").header("Authorization", "Bearer " + login("rudo")))
                .andReturn().getResponse().getContentAsString();
        send(post("/merchants/active/sell"), player, "{\"entryId\":" + lineId(other, "Adaga Teste") + ",\"quantity\":1}").andExpect(status().isNotFound());
        send(put("/merchants/" + m), master, "{\"name\":\"Tobias\",\"buyRate\":0}").andExpect(status().isOk());
        send(post("/merchants/active/sell"), login("rudo"), "{\"entryId\":" + lineId(other, "Adaga Teste") + ",\"quantity\":1}").andExpect(status().isBadRequest());
    }

    @Test
    void apagaMercadorComMovimento() throws Exception {
        create("gaudron");
        String master = login("mestre");
        String player = login("gaudron");
        long m = merchant(master, "Tobias");
        send(post("/merchants/" + m + "/open"), master, "").andExpect(status().isOk());
        String sheet = mvc.perform(get("/character/me").header("Authorization", "Bearer " + player))
                .andReturn().getResponse().getContentAsString();
        send(post("/merchants/active/sell"), player, "{\"entryId\":" + lineId(sheet, "Adaga Teste") + ",\"quantity\":1}").andExpect(status().isOk());
        mvc.perform(delete("/merchants/" + m).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
        mvc.perform(get("/merchants").header("Authorization", "Bearer " + master)).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + player)).andExpect(status().isOk());
    }

    @Test
    void jogadorPechinchaUmaVezPorAbertura() throws Exception {
        long id = create("gaudron");
        String master = login("mestre");
        String player = login("gaudron");
        send(patch("/character/" + id + "/gold"), master, "{\"gold\":100}").andExpect(status().isOk());
        long m = merchant(master, "Tobias");
        send(put("/merchants/" + m), master, "{\"name\":\"Tobias\",\"haggleDc\":41}").andExpect(status().isBadRequest());
        String shop = send(post("/merchants/" + m + "/items"), master, "{\"catalogId\":\"t-machado\"}")
                .andExpect(jsonPath("$.haggleDc").value(15))
                .andReturn().getResponse().getContentAsString();
        long axe = lineId(shop, "Machado Teste");
        send(post("/merchants/active/haggle"), player, "{\"skill\":\"PERSUASION\"}").andExpect(status().isNotFound());
        send(post("/merchants/" + m + "/open"), master, "").andExpect(status().isOk());

        send(post("/merchants/active/haggle"), player, "{\"skill\":\"ATHLETICS\"}").andExpect(status().isBadRequest());
        String after = send(post("/merchants/active/haggle"), player, "{\"skill\":\"PERSUASION\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.haggle.skill").value("PERSUASION"))
                .andExpect(jsonPath("$.haggle.dc").value(15))
                .andExpect(jsonPath("$.items[0].basePrice").value(10))
                .andReturn().getResponse().getContentAsString();
        int percent = Integer.parseInt(group(after, "\"percent\":(-?\\d+)"));
        assertThat(percent).isIn(-20, -10, 0, 10, 20);
        int price = Integer.parseInt(group(after, "\"price\":(\\d+)"));
        assertThat(price).isEqualTo((int) Math.ceil(10 * (100 + percent) / 100.0));
        send(post("/merchants/active/haggle"), player, "{\"skill\":\"DECEPTION\"}").andExpect(status().isBadRequest());

        // A compra cobra o preço dele; o mestre vê a pechincha e o preço da prateleira.
        send(post("/merchants/active/buy"), player, "{\"lineId\":" + axe + ",\"quantity\":1,\"price\":" + price + "}")
                .andExpect(jsonPath("$.sheet.character.gold").value(100 - price));
        mvc.perform(get("/merchants").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$[0].items[0].price").value(10))
                .andExpect(jsonPath("$[0].haggles[0].characterName").value("Nyx"));

        // Reabrir zera as pechinchas; CD 0 = não pechincha.
        send(post("/merchants/" + m + "/close"), master, "").andExpect(status().isOk());
        send(put("/merchants/" + m), master, "{\"name\":\"Tobias\",\"haggleDc\":0}").andExpect(status().isOk());
        send(post("/merchants/" + m + "/open"), master, "").andExpect(jsonPath("$.haggles").isEmpty());
        send(post("/merchants/active/haggle"), player, "{\"skill\":\"PERSUASION\"}").andExpect(status().isBadRequest());
    }

    private static String group(String json, String regex) {
        Matcher m = Pattern.compile(regex).matcher(json);
        assertThat(m.find()).as(regex).isTrue();
        return m.group(1);
    }

    private long merchant(String master, String name) throws Exception {
        String body = send(post("/merchants"), master, "{\"name\":\"" + name + "\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.buyRate").value(50))
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("^\\{\"id\":(\\d+)").matcher(body);
        assertThat(m.find()).isTrue();
        return Long.parseLong(m.group(1));
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // id da linha pelo nome do item, num JSON com {"id":N,...,"name":"..."}.
    private static long lineId(String json, String name) {
        Matcher m = Pattern.compile("\"id\":(\\d+),(\"catalogId\":(null|\"[^\"]*\"),)?\"name\":\"" + Pattern.quote(name) + "\"").matcher(json);
        assertThat(m.find()).as(name).isTrue();
        return Long.parseLong(m.group(1));
    }

    private long create(String username) throws Exception {
        String created = mvc.perform(post("/creation").header("Authorization", "Bearer " + login(username))
                        .contentType(MediaType.APPLICATION_JSON).content(NYX.replace("Nyx", username.equals("gaudron") ? "Nyx" : username)))
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
