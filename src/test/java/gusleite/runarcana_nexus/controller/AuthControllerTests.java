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
                .containsExactlyInAnyOrder("rudo", "gaudron", "proto", "titan", "loge", "mestre", "teste");
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

    @Test
    void soOMestreEntraComoOPersonagemDeTeste() throws Exception {
        mvc.perform(post("/auth/test-player").header("Authorization", "Bearer " + login("rudo", "rudo")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/auth/test-player")).andExpect(status().isUnauthorized());

        mvc.perform(post("/auth/test-player").header("Authorization", "Bearer " + login("mestre", "mestre")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.account.username").value("teste"))
                .andExpect(jsonPath("$.account.master").value(false))
                .andExpect(jsonPath("$.account.mustChangePassword").value(false));
    }

    @Test
    void contaDeTesteNaoEntraPeloLogin() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"teste\",\"password\":\"teste\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void mestreAdicionaJogadorQueApareceNaListaEEntraComONome() throws Exception {
        mvc.perform(get("/auth/players")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

        mvc.perform(post("/auth/players").header("Authorization", "Bearer " + login("rudo", "rudo"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"lyra\"}"))
                .andExpect(status().isForbidden());

        String master = login("mestre", "mestre");
        mvc.perform(post("/auth/players").header("Authorization", "Bearer " + master)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\" Lyra \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("lyra"));

        mvc.perform(get("/auth/players")).andExpect(jsonPath("$[0].username").value("lyra"));
        login("lyra", "lyra");

        // repetido, reservado e inválido
        for (String name : new String[]{"lyra", "rudo", "teste", "a", "nome com espaço"}) {
            mvc.perform(post("/auth/players").header("Authorization", "Bearer " + master)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"" + name + "\"}"))
                    .andExpect(status().isBadRequest());
        }
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
