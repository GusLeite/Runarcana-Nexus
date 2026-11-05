package gusleite.runarcana_nexus.services;

import jakarta.annotation.PreDestroy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

// Canal ao vivo (SSE): guarda as conexões abertas e avisa todas quando algo muda.
// O evento é só um aviso de tópico ({"topic":"map"}), sem dados: a tela busca de novo pelas rotas de sempre,
// com as permissões da própria conta, então nada oculto vaza por aqui. Fica em memória (uma instância só).
@Service
public class LiveHub {

    // A conexão cai sozinha depois disso; o cliente pede outro ticket e reconecta.
    static final Duration TIMEOUT = Duration.ofMinutes(30);
    private static final long HEARTBEAT_SECONDS = 20;

    private final Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService heartbeat = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "live-heartbeat");
        t.setDaemon(true);
        return t;
    });

    public LiveHub() {
        heartbeat.scheduleAtFixedRate(this::beat, HEARTBEAT_SECONDS, HEARTBEAT_SECONDS, TimeUnit.SECONDS);
    }

    public SseEmitter open() {
        SseEmitter emitter = new SseEmitter(TIMEOUT.toMillis());
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        emitters.add(emitter);
        // Primeiro evento: o cliente sabe que está ligado e confere o que perdeu enquanto estava fora.
        send(emitter, SseEmitter.event().name("hello").data("{}", MediaType.APPLICATION_JSON));
        return emitter;
    }

    public void publish(String topic) {
        String data = "{\"topic\":\"" + topic + "\"}";
        for (SseEmitter emitter : emitters) {
            send(emitter, SseEmitter.event().name("change").data(data, MediaType.APPLICATION_JSON));
        }
    }

    int connections() {
        return emitters.size();
    }

    // Comentário SSE: mantém a conexão viva atrás de proxies que derrubam conexão parada.
    private void beat() {
        for (SseEmitter emitter : emitters) {
            send(emitter, SseEmitter.event().comment("ping"));
        }
    }

    private void send(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            synchronized (emitter) {
                emitter.send(event);
            }
        } catch (IOException | IllegalStateException e) {
            emitters.remove(emitter);
            emitter.completeWithError(e);
        }
    }

    @PreDestroy
    void shutdown() {
        heartbeat.shutdownNow();
        emitters.forEach(SseEmitter::complete);
        emitters.clear();
    }
}
