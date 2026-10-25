package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.repository.AccountRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AccountRepository accounts;

    @Test
    void criaAsContasDosCincoPersonagensEADoMestre() {
        assertThat(accounts.findAll()).extracting("username")
                .containsExactlyInAnyOrder("rudo", "gaudron", "proto", "titan", "loge", "mestre");
        assertThat(accounts.findByUsername("mestre")).hasValueSatisfying(a -> assertThat(a.isMaster()).isTrue());
        assertThat(accounts.findByUsername("rudo")).hasValueSatisfying(a -> assertThat(a.isMaster()).isFalse());
    }

    @Test
    void entraComONomeDoPersonagemSemDiferenciarMaiusculas() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\" RUDO \",\"password\":\"rudo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.account.username").value("rudo"))
                .andExpect(jsonPath("$.account.mustChangePassword").value(true));
    }

    @Test
    void recusaSenhaErrada() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"rudo\",\"password\":\"gaudron\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuário ou senha incorretos."));
    }

    @Test
    void meExigeToken() throws Exception {
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/auth/me").header("Authorization", "Bearer invalido")).andExpect(status().isUnauthorized());
    }

    @Test
    void trocaASenhaEPassaAEntrarComANova() throws Exception {
        String token = login("gaudron", "gaudron");

        mvc.perform(put("/auth/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"gaudron\",\"newPassword\":\"forja-eterna\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false));

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gaudron\",\"password\":\"gaudron\"}"))
                .andExpect(status().isUnauthorized());
        login("gaudron", "forja-eterna");

        // a sessão de quem trocou a senha continua valendo
        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("gaudron"));
    }

    @Test
    void trocarASenhaDerrubaAsOutrasSessoes() throws Exception {
        String celular = login("proto", "proto");
        String pc = login("proto", "proto");

        mvc.perform(put("/auth/password").header("Authorization", "Bearer " + pc)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"proto\",\"newPassword\":\"engrenagem\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + celular)).andExpect(status().isUnauthorized());
        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + pc)).andExpect(status().isOk());
    }

    @Test
    void validaANovaSenha() throws Exception {
        String token = login("titan", "titan");

        changePassword(token, "errada", "montanha")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A senha atual está incorreta."));
        changePassword(token, "titan", "123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A nova senha precisa ter entre 6 e 72 caracteres."));
        changePassword(token, "titan", "TITAN ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A nova senha não pode ser o nome do personagem."));
    }

    @Test
    void logoutInvalidaOToken() throws Exception {
        String token = login("loge", "loge");

        mvc.perform(post("/auth/logout").header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions changePassword(String token, String current, String next) throws Exception {
        return mvc.perform(put("/auth/password").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"" + current + "\",\"newPassword\":\"" + next + "\"}"));
    }

    private String login(String username, String password) throws Exception {
        String body = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }
}
