package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Magias/habilidades, anotações e documentos do mestre.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PlayerFeaturesTests {

    private static final String RUDO = """
            {"playerName":"Mendonça","characterName":"Rudo","level":4,"gold":10,"age":18,"height":1.8,
             "characterClass":"ARCANIST","maxHp":33,"currentHp":33,"str":9,"dex":13,"intel":18,"wis":17,
             "cha":10,"con":15,"skills":["ARCANA"],"inspiration":0}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CharacterClassRepository classes;

    @Autowired
    private CharacterRepository characters;

    private long rudoId;

    @BeforeEach
    void seed() throws Exception {
        CharacterClass arcanist = new CharacterClass();
        arcanist.setClassName(CharacterClassType.ARCANIST);
        arcanist.setHitHpDice(6);
        classes.save(arcanist);
        mvc.perform(post("/character").contentType(MediaType.APPLICATION_JSON).content(RUDO))
                .andExpect(status().isCreated());
        rudoId = characters.findAll().getFirst().getId();
    }

    // ---------- magias e habilidades ----------

    @Test
    void mestreCadastraHabilidadeEJogadorGastaEDescansa() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");

        String body = mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Seta Estelar","type":"SPELL","spellLevel":1,"range":"36 m",
                                 "damage":"2d6 + 4","maxUses":3,"recharge":"SHORT_REST"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.damage").value("2d6+4"))
                .andExpect(jsonPath("$.usesLeft").value(3))
                .andReturn().getResponse().getContentAsString();
        long abilityId = idOf(body);

        mvc.perform(get("/character/me").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$.abilities[0].name").value("Seta Estelar"))
                .andExpect(jsonPath("$.character.hitDie").value(6));

        mvc.perform(patch("/character/me/abilities/" + abilityId).header("Authorization", "Bearer " + rudo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usesLeft\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usesLeft").value(1));

        mvc.perform(patch("/character/me/abilities/" + abilityId).header("Authorization", "Bearer " + rudo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usesLeft\":9}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/character/me/rest").header("Authorization", "Bearer " + rudo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"SHORT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usesLeft").value(3));
    }

    // Rudo: 4º nível (proficiência +2), INT 18 (+4). A Conjuração do livro diz o atributo e o nível máximo (2º no 4º).
    @Test
    void conjurarGastaManaPeloNivel() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        ability(master, """
                {"name":"Conjuração","type":"ABILITY","description":"Truques / magias / nível máximo: 1º 3/4/1º · 2º 3/5 · 3º 3/6/2º · 5º 4/8/3º.\\n\\nAtributo de conjuração: Inteligência. CD = 8 + proficiência + mod."}
                """);
        long mana = ability(master, "{\"name\":\"Pontos de Mana\",\"type\":\"ABILITY\",\"maxUses\":6}");
        long cantrip = ability(master, "{\"name\":\"Raio de Gelo\",\"type\":\"SPELL\",\"spellLevel\":0}");
        long seta = ability(master, "{\"name\":\"Seta Estelar\",\"type\":\"SPELL\",\"spellLevel\":1}");
        long free = ability(master, "{\"name\":\"Passo Nebuloso\",\"type\":\"SPELL\",\"spellLevel\":1,\"maxUses\":1}");

        mvc.perform(get("/character/me").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$.spellcasting.maxSpellLevel").value(2))
                .andExpect(jsonPath("$.spellcasting.casters[0].attribute").value("INTELLIGENCE"))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Seta Estelar')].saveDc").value(14))
                .andExpect(jsonPath("$.abilities[?(@.name == 'Seta Estelar')].spellAttack").value(6));

        cast(rudo, cantrip, null).andExpect(status().isOk()).andExpect(jsonPath("$.manaCost").value(0));
        cast(rudo, seta, 1).andExpect(jsonPath("$.manaCost").value(2))
                .andExpect(jsonPath("$.abilities[?(@.id == " + mana + ")].usesLeft").value(4));
        cast(rudo, seta, 2).andExpect(jsonPath("$.manaCost").value(3))
                .andExpect(jsonPath("$.abilities[?(@.id == " + mana + ")].usesLeft").value(1));
        // Acima do nível máximo, abaixo do nível da magia e Mana que não dá.
        cast(rudo, seta, 3).andExpect(status().isBadRequest());
        cast(rudo, free, 0).andExpect(status().isBadRequest());
        cast(rudo, seta, 1).andExpect(status().isBadRequest());
        // Usos próprios: gasta o uso, não a Mana; acabou o uso, cai na Mana (que não dá).
        cast(rudo, free, null).andExpect(jsonPath("$.usedUse").value(true))
                .andExpect(jsonPath("$.abilities[?(@.id == " + mana + ")].usesLeft").value(1));
        cast(rudo, free, null).andExpect(status().isBadRequest());
        cast(rudo, mana, null).andExpect(status().isBadRequest());
    }

    private long ability(String master, String json) throws Exception {
        return idOf(mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
    }

    private org.springframework.test.web.servlet.ResultActions cast(String token, long abilityId, Integer level) throws Exception {
        return mvc.perform(post("/character/me/abilities/" + abilityId + "/cast").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(level == null ? "{}" : "{\"level\":" + level + "}"));
    }

    @Test
    void mestreListaHabilidadesDoPersonagemEApaga() throws Exception {
        String master = login("mestre");
        String body = mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Fúria\",\"type\":\"ABILITY\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        mvc.perform(get("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Fúria"));
        mvc.perform(get("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + login("rudo")))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/character/" + rudoId + "/abilities/" + idOf(body)).header("Authorization", "Bearer " + master))
                .andExpect(status().isNoContent());
        mvc.perform(get("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void habilidadeGuardaIconeEMestreTrocaOuRemove() throws Exception {
        String master = login("mestre");
        String png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        String body = mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Raio\",\"type\":\"SPELL\",\"spellLevel\":0,\"icon\":\"" + png + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.icon").value(png))
                .andReturn().getResponse().getContentAsString();
        long abilityId = idOf(body);
        String iconUrl = "/character/" + rudoId + "/abilities/" + abilityId + "/icon";

        mvc.perform(get("/character/me").header("Authorization", "Bearer " + login("rudo")))
                .andExpect(jsonPath("$.abilities[0].icon").value(png));

        mvc.perform(patch(iconUrl).header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"icon\":\"https://exemplo.com/raio.png\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.icon").value("https://exemplo.com/raio.png"));

        mvc.perform(patch(iconUrl).header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"icon\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.icon").doesNotExist());

        mvc.perform(patch(iconUrl).header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"icon\":\"data:text/html;base64,PHNjcmlwdD4=\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O ícone deve ser uma imagem PNG, JPEG, WebP ou GIF, ou um link http(s)."));

        mvc.perform(patch(iconUrl).header("Authorization", "Bearer " + login("rudo"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"icon\":null}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void mestreVeQuemPodeReceberDocumentos() throws Exception {
        mvc.perform(get("/documents/recipients").header("Authorization", "Bearer " + login("mestre")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0]").value("gaudron"));
        mvc.perform(get("/documents/recipients").header("Authorization", "Bearer " + login("loge")))
                .andExpect(status().isForbidden());
    }

    @Test
    void soOMestreCadastraHabilidade() throws Exception {
        mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + login("rudo"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Trapaça\",\"type\":\"ABILITY\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Só o mestre pode fazer isso."));
    }

    @Test
    void recusaDanoForaDoFormato() throws Exception {
        mvc.perform(post("/character/" + rudoId + "/abilities").header("Authorization", "Bearer " + login("mestre"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Bola\",\"type\":\"SPELL\",\"damage\":\"muito\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O dano deve ser como 2d6 ou 2d6+4."));
    }

    // ---------- anotações ----------

    @Test
    void jogadorCriaEditaEApagaAnotacoesSemVerAsDosOutros() throws Exception {
        String rudo = login("rudo");
        String gaudron = login("gaudron");

        String body = mvc.perform(post("/notes").header("Authorization", "Bearer " + rudo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"  \",\"body\":\"Pistas do templo\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Sem título"))
                .andReturn().getResponse().getContentAsString();
        long noteId = idOf(body);

        mvc.perform(put("/notes/" + noteId).header("Authorization", "Bearer " + rudo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Templo\",\"body\":\"Ir à noite\",\"pinned\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinned").value(true));

        mvc.perform(get("/notes").header("Authorization", "Bearer " + gaudron))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(put("/notes/" + noteId).header("Authorization", "Bearer " + gaudron)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/notes/" + noteId).header("Authorization", "Bearer " + rudo)).andExpect(status().isNoContent());
        mvc.perform(get("/notes").header("Authorization", "Bearer " + rudo)).andExpect(jsonPath("$.length()").value(0));
    }

    // ---------- documentos ----------

    @Test
    void documentoChegaSoParaQuemORecebeuEMarcaLido() throws Exception {
        String master = login("mestre");
        String rudo = login("rudo");
        String gaudron = login("gaudron");

        String body = mvc.perform(post("/documents").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Carta selada\",\"kind\":\"SECRET\",\"body\":\"Só você sabe.\",\"recipients\":[\"Rudo\"]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recipients[0]").value("rudo"))
                .andReturn().getResponse().getContentAsString();
        long docId = idOf(body);
        mvc.perform(post("/documents").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Mapa de Targon\",\"kind\":\"MAP\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.toAll").value(true));

        mvc.perform(get("/documents/me").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].title").value("Carta selada"))
                .andExpect(jsonPath("$[1].read").value(false))
                .andExpect(jsonPath("$[1].recipients").doesNotExist());
        mvc.perform(get("/documents/me").header("Authorization", "Bearer " + gaudron))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Mapa de Targon"));

        mvc.perform(post("/documents/" + docId + "/read").header("Authorization", "Bearer " + rudo)).andExpect(status().isNoContent());
        mvc.perform(post("/documents/" + docId + "/read").header("Authorization", "Bearer " + gaudron)).andExpect(status().isNotFound());
        mvc.perform(get("/documents/me").header("Authorization", "Bearer " + rudo))
                .andExpect(jsonPath("$[1].read").value(true));

        mvc.perform(delete("/documents/" + docId).header("Authorization", "Bearer " + master)).andExpect(status().isNoContent());
        mvc.perform(get("/documents/me").header("Authorization", "Bearer " + rudo)).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void jogadorNaoEnviaDocumentoEDestinatarioPrecisaExistir() throws Exception {
        sendDocument(login("rudo"), "{\"title\":\"Falso\",\"kind\":\"LETTER\"}").andExpect(status().isForbidden());
        sendDocument(login("mestre"), "{\"title\":\"Para ninguém\",\"kind\":\"LETTER\",\"recipients\":[\"zed\"]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Não existe jogador \"zed\"."));
    }

    private ResultActions sendDocument(String token, String json) throws Exception {
        return mvc.perform(post("/documents").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static long idOf(String json) {
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(json);
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
