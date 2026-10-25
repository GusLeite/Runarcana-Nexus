package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                .andExpect(jsonPath("$.skills.length()").value(7))
                .andExpect(jsonPath("$.proficiencyBonus").value(2))
                .andExpect(jsonPath("$.passivePerception").value(12));

        mvc.perform(get("/character"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].playerName").value("Mendonça"));
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
}
