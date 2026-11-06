package gusleite.runarcana_nexus.config;

import gusleite.runarcana_nexus.services.LiveHub;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Map;
import java.util.Set;

// Publica no canal ao vivo depois de toda alteração que deu certo (POST/PUT/PATCH/DELETE com 2xx),
// pelo 1º trecho da rota. Assim nenhum service precisa lembrar de avisar; rota nova cai no tópico da sua área.
@Configuration
public class LiveConfig implements WebMvcConfigurer {

    // 1º trecho da rota -> tópico. O que não está aqui (auth, notes, lore, live...) não avisa ninguém.
    static final Map<String, String> TOPICS = Map.of(
            "character", "table",
            "conditions", "table",
            "creation", "table",
            "map", "map",
            "merchants", "merchants",
            "journal", "journal",
            "documents", "documents",
            "combat", "combat");

    private static final Set<String> READS = Set.of("GET", "HEAD", "OPTIONS");
    // Sinais efêmeros do mapa: vão pelo próprio canal (MapSignalService), não fazem as telas buscarem nada.
    private static final Set<String> QUIET = Set.of("/map/focus", "/map/ping");

    private final LiveHub hub;

    public LiveConfig(LiveHub hub) {
        this.hub = hub;
    }

    public static String topicOf(String path) {
        if (path == null) return null;
        String trimmed = path.startsWith("/") ? path.substring(1) : path;
        int slash = trimmed.indexOf('/');
        return TOPICS.get(slash < 0 ? trimmed : trimmed.substring(0, slash));
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
                if (ex != null || READS.contains(request.getMethod())) return;
                int status = response.getStatus();
                if (status < 200 || status >= 300) return;
                String path = request.getRequestURI().substring(request.getContextPath().length());
                if (QUIET.contains(path)) return;
                String topic = topicOf(path);
                if (topic != null) hub.publish(topic);
            }
        });
    }
}
