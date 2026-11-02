package gusleite.runarcana_nexus.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Como em produção: sem senha igual ao nome, senha do mestre configurada e limite de tentativas de login.
@SpringBootTest(properties = {
        "runarcana.auth.username-as-initial-password=false",
        "runarcana.auth.master-password=senha-do-mestre",
        "runarcana.auth.login-max-attempts=3"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthSecurityDefaultsTests {

    @Autowired
    private MockMvc mvc;

    private ResultActions login(String username, String password) throws Exception {
        return mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"));
    }

    @Test
    void senhaInicialNaoEONomeDoUsuario() throws Exception {
        login("rudo", "rudo").andExpect(status().isUnauthorized());
        login("mestre", "mestre").andExpect(status().isUnauthorized());
    }

    @Test
    void mestreEntraComASenhaConfigurada() throws Exception {
        login("mestre", "senha-do-mestre")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.mustChangePassword").value(true));
    }

    @Test
    void bloqueiaDepoisDeMuitasSenhasErradasMesmoComASenhaCerta() throws Exception {
        for (int i = 0; i < 3; i++) {
            login("rudo", "errada").andExpect(status().isUnauthorized());
        }
        login("mestre", "senha-do-mestre").andExpect(status().isTooManyRequests());
    }

    @Test
    void loginCertoZeraAsTentativas() throws Exception {
        login("rudo", "errada").andExpect(status().isUnauthorized());
        login("rudo", "errada").andExpect(status().isUnauthorized());
        login("mestre", "senha-do-mestre").andExpect(status().isOk());
        login("rudo", "errada").andExpect(status().isUnauthorized());
        login("rudo", "errada").andExpect(status().isUnauthorized());
        login("mestre", "senha-do-mestre").andExpect(status().isOk());
    }
}
