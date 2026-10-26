package gusleite.runarcana_nexus;

import org.springframework.boot.SpringApplication;

import java.util.Arrays;
import java.util.stream.Stream;

// Sobe o back descartável para testar no navegador: H2 em memória, porta 8090 e as regras reais
// (perfil "sandbox"). Roda pelo classpath de testes: mvnw test-compile spring-boot:test-run
// (configuração "backend-sandbox" do .claude/launch.json).
// Os argumentos abaixo têm prioridade sobre qualquer application.properties, então ele nunca conecta
// no PostgreSQL: se o H2 não estiver no classpath, falha em vez de cair no banco de verdade.
public final class SandboxApplication {

    private static final String[] SANDBOX = {
            "--spring.profiles.active=sandbox",
            "--server.port=8090",
            // o application.properties de teste (que vem antes no classpath) não tem o prefixo das rotas
            "--server.servlet.context-path=/runarcana",
            "--spring.datasource.url=jdbc:h2:mem:sandbox;DB_CLOSE_DELAY=-1",
            "--spring.datasource.driver-class-name=org.h2.Driver",
            "--spring.datasource.username=sa",
            "--spring.datasource.password=",
            "--spring.jpa.hibernate.ddl-auto=create-drop",
    };

    private SandboxApplication() {}

    public static void main(String[] args) {
        String[] all = Stream.concat(Arrays.stream(SANDBOX), Arrays.stream(args)).toArray(String[]::new);
        SpringApplication.run(RunarcanaNexusApplication.class, all);
    }
}
