package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.enums.WeaponProperty;
import gusleite.runarcana_nexus.model.items.Armor;
import gusleite.runarcana_nexus.model.items.Consumable;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.items.Weapon;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.ItemRepository;
import gusleite.runarcana_nexus.repository.PlayerItemsRepository;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CharacterControllerTests {

    // Payload real usado para criar o Rudo (números como string, como o Postman manda).
    private static final String RUDO = """
            {
              "playerName": "Mendonça",
              "characterName": "Rudo",
              "level" : "4",
              "gold" : "10",
              "age": "18",
              "height": "1.80",
              "characterClass" : "ARCANIST",
              "maxHp": "33",
              "currentHp": "33",
              "str" : "9",
              "dex" : "13",
              "intel": "18",
              "wis": "17",
              "cha" : "10",
              "con" : "15",
              "skills": ["ARCANA","HISTORY","INSIGHT","NATURE","PERCEPTION","RELIGION","TECHNOLOGY"],
              "region": "TARGON",
              "background" : "Estudioso",
              "alignment" : "NEUTRAL_GOOD",
              "inspiration": "0"
            }
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CharacterClassRepository classes;

    @Autowired
    private BackGroundRepository backgrounds;

    @Autowired
    private CharacterRepository characters;

    @Autowired
    private ItemRepository items;

    @Autowired
    private PlayerItemsRepository inventory;

    @BeforeEach
    void seed() {
        CharacterClass arcanist = new CharacterClass();
        arcanist.setClassName(CharacterClassType.ARCANIST);
        arcanist.setHitHpDice(6);
        classes.save(arcanist);

        Background scholar = new Background();
        scholar.setName("Estudioso");
        backgrounds.save(scholar);
    }

    @Test
    void criaOPersonagemResolvendoClasseAntecedenteEPericias() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON).content(RUDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.characterName").value("Rudo"))
                .andExpect(jsonPath("$.characterClass").value("ARCANIST"))
                .andExpect(jsonPath("$.background").value("Estudioso"))
                .andExpect(jsonPath("$.skills.length()").value(19))
                .andExpect(jsonPath("$.skills[?(@.proficient == true)].skill").value(org.hamcrest.Matchers.hasSize(7)))
                // Arcanismo: INT 18 (+4) + proficiência (+2); Atletismo: FOR 9 (-1), sem proficiência
                .andExpect(jsonPath("$.skills[?(@.skill == 'ARCANA')].modifier").value(6))
                .andExpect(jsonPath("$.skills[?(@.skill == 'ATHLETICS')].modifier").value(-1))
                .andExpect(jsonPath("$.proficiencyBonus").value(2))
                // 10 + SAB 17 (+3) + proficiência (+2)
                .andExpect(jsonPath("$.passivePerception").value(15));

        // Só o mestre lista as fichas e vê a mesa.
        mvc.perform(get("/character")).andExpect(status().isUnauthorized());
        mvc.perform(get("/character").header("Authorization", "Bearer " + login("rudo"))).andExpect(status().isForbidden());
        String master = login("mestre");
        mvc.perform(get("/character").header("Authorization", "Bearer " + master))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].playerName").value("Mendonça"));
        mvc.perform(get("/character/table").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$[0].character.characterName").value("Rudo"))
                .andExpect(jsonPath("$[0].armorClass").value(11))
                .andExpect(jsonPath("$[0].manaMax").doesNotExist());
        mvc.perform(get("/character/table").header("Authorization", "Bearer " + login("rudo"))).andExpect(status().isForbidden());
    }

    @Test
    void devolveAFichaDoPersonagemLogadoComInventario() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON).content(RUDO))
                .andExpect(status().isCreated());
        Character rudo = characters.findAll().getFirst();

        Weapon staff = new Weapon();
        staff.setName("Cajado Rúnico");
        staff.setRarity(Rarity.Rare);
        staff.setWeight(2.0);
        staff.setHitDice(6);
        staff.setHitDiceQuantity(1);
        staff.setDamageType(DamageType.B);
        staff.getProperties().add(WeaponProperty.VERSATILE);
        Consumable potion = new Consumable();
        potion.setName("Poção de Cura");
        potion.setRarity(Rarity.Common);
        inventory.save(entry(rudo, items.save(staff), 1));
        inventory.save(entry(rudo, items.save(potion), 3));
        Armor scale = new Armor();
        scale.setName("Cota de Escamas");
        scale.setRarity(Rarity.Common);
        scale.setArmorClass(14);
        scale.setModifierAttribute(Attribute.DEXTERITY);
        scale.setArmorWeight(ArmorWeight.MEDIUM);
        scale.setDamageReduction(1);
        inventory.save(entry(rudo, items.save(scale), 1));

        mvc.perform(get("/character/me").header("Authorization", "Bearer " + login("rudo")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.character.characterName").value("Rudo"))
                // CA: sem armadura 10 + DES 13 (+1) = 11; Cota de Escamas 14 + 1 = 15 com RD 1 (a maior vale por padrão)
                .andExpect(jsonPath("$.armorClass.options[0].value").value(11))
                .andExpect(jsonPath("$.armorClass.value").value(15))
                .andExpect(jsonPath("$.armorClass.reduction").value(1))
                .andExpect(jsonPath("$.armorClass.options[1].label").value("Cota de Escamas"))
                .andExpect(jsonPath("$.inventory.length()").value(3))
                .andExpect(jsonPath("$.inventory[0].kind").value("WEAPON"))
                .andExpect(jsonPath("$.inventory[0].damage").value("1d6"))
                .andExpect(jsonPath("$.inventory[0].properties[0]").value("VERSATILE"))
                .andExpect(jsonPath("$.inventory[1].kind").value("CONSUMABLE"))
                .andExpect(jsonPath("$.inventory[1].quantity").value(3));
    }

    @Test
    void fichaExigeLoginEAvisaQuandoNaoExiste() throws Exception {
        mvc.perform(get("/character/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + login("gaudron")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Sua ficha ainda não foi criada. Crie seu personagem."));
    }

    @Test
    void escudoDoInventarioSomaNaCa() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON).content(RUDO))
                .andExpect(status().isCreated());
        Character rudo = characters.findAll().getFirst();
        // Escudo do catálogo de teste (t-escudo, +2): entra no inventário como objeto comum, achado pelo catalogId.
        gusleite.runarcana_nexus.model.items.Object shield = new gusleite.runarcana_nexus.model.items.Object();
        shield.setName("Escudo Teste");
        shield.setRarity(Rarity.Common);
        shield.setCatalogId("t-escudo");
        PlayerItems entry = inventory.save(entry(rudo, items.save(shield), 1));
        String key = "ITEM:" + entry.getId();
        String token = login("rudo");

        // Sem escolha, o escudo já soma: 10 + DES 13 (+1) + 2.
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.armorClass.value").value(13))
                .andExpect(jsonPath("$.armorClass.shield").value(key))
                .andExpect(jsonPath("$.armorClass.shields[0].bonus").value(2))
                .andExpect(jsonPath("$.armorClass.bonuses[0]").value("Escudo Teste +2 (sem proficiência com escudos)"));
        mvc.perform(patch("/character/me/shield").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"NONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value(11))
                .andExpect(jsonPath("$.shield").doesNotExist());
        mvc.perform(patch("/character/me/shield").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"ITEM:999\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Esse escudo não está no seu inventário."));
        mvc.perform(patch("/character/me/shield").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"" + key + "\"}"))
                .andExpect(jsonPath("$.value").value(13));
    }

    @Test
    void jogadorAlteraOsPropriosPv() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON).content(RUDO))
                .andExpect(status().isCreated());
        String token = login("rudo");
        mvc.perform(patch("/character/me/hp").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":20,\"tempHp\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentHp").value(20))
                .andExpect(jsonPath("$.tempHp").value(5));
        // Sem tempHp, os temporários ficam como estão.
        mvc.perform(patch("/character/me/hp").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":33}"))
                .andExpect(jsonPath("$.currentHp").value(33))
                .andExpect(jsonPath("$.tempHp").value(5));
        mvc.perform(get("/character/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.character.tempHp").value(5));
        mvc.perform(patch("/character/me/hp").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":34}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Os PV atuais vão de 0 a 33."));
        mvc.perform(patch("/character/me/hp").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":10,\"tempHp\":-1}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/character/me/hp").contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":1}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch("/character/me/hp").header("Authorization", "Bearer " + login("gaudron"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"currentHp\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void recusaClasseQueNaoFoiCadastrada() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON)
                        .content(RUDO.replace("ARCANIST", "SHAMAN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A classe SHAMAN ainda não foi cadastrada."));
    }

    @Test
    void recusaAntecedenteQueNaoExiste() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON)
                        .content(RUDO.replace("Estudioso", "Pirata")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O antecedente \"Pirata\" ainda não foi cadastrado."));
    }

    @Test
    void recusaCampoObrigatorioFaltando() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON)
                        .content(RUDO.replace("\"Rudo\"", "\"  \"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Informe o nome do personagem."));
    }

    @Test
    void recusaClasseForaDoEnum() throws Exception {
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON)
                        .content(RUDO.replace("ARCANIST", "MAGO")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("JSON inválido ou com algum valor fora das opções aceitas."));
    }

    private static PlayerItems entry(Character character, Item item, int quantity) {
        PlayerItems entry = new PlayerItems();
        entry.setCharacter(character);
        entry.setItem(item);
        entry.setQuantity(quantity);
        return entry;
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
