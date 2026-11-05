package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.map.MapPoi;
import gusleite.runarcana_nexus.repository.AccountRepository;
import gusleite.runarcana_nexus.repository.MapPoiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

// Sinais efêmeros do mapa pelo canal ao vivo (nada é salvo):
// - "Olhem aqui!" (só o mestre): leva a câmera de todos até um lugar ou um ponto de interesse. Ponto oculto só vai
//   para quem o vê (e o mestre), para não entregar onde ele fica.
// - Ping (qualquer conta): uma onda na cor de quem clicou, que todos veem por alguns segundos. Até MAX_PINGS a cada
//   PING_WINDOW_MS por conta (429 depois disso).
@Service
public class MapSignalService {

    static final int LIMIT = 1024;
    static final int MAX_PINGS = 3;
    static final long PING_WINDOW_MS = 3000;

    public record FocusRequest(Integer x, Integer y, Long poiId) {}

    public record PingRequest(Integer x, Integer y) {}

    // sentTo: quantas conexões abertas receberam (o mestre incluído, se estiver com o canal aberto).
    public record SignalResult(int sentTo) {}

    private final LiveHub hub;
    private final MapPoiRepository pois;
    private final AccountRepository accounts;
    private final JournalService journal;
    private final Map<String, Deque<Long>> pings = new ConcurrentHashMap<>();

    public MapSignalService(LiveHub hub, MapPoiRepository pois, AccountRepository accounts, JournalService journal) {
        this.hub = hub;
        this.pois = pois;
        this.accounts = accounts;
        this.journal = journal;
    }

    @Transactional(readOnly = true)
    public SignalResult focus(Account master, FocusRequest r) {
        Map<String, Object> data = new LinkedHashMap<>();
        Set<String> audience = null; // nulo = todos
        if (r.poiId() != null) {
            MapPoi poi = pois.findById(r.poiId()).orElseThrow(() -> ApiException.notFound("Ponto não encontrado."));
            data.put("x", poi.getX());
            data.put("y", poi.getY());
            data.put("poiId", poi.getId());
            data.put("name", poi.getName());
            if (!poi.isToAll()) {
                audience = accounts.findAll().stream()
                        .filter(a -> RecipientResolver.reaches(a, poi.isToAll(), poi.getRecipients()))
                        .map(Account::getUsername)
                        .collect(Collectors.toSet());
            }
        } else {
            data.put("x", coordinate(r.x()));
            data.put("y", coordinate(r.y()));
        }
        data.put("from", master.getUsername());
        Set<String> to = audience;
        return new SignalResult(hub.send("map-focus", data, username -> to == null || to.contains(username)));
    }

    public SignalResult ping(Account account, PingRequest r) {
        int x = coordinate(r.x());
        int y = coordinate(r.y());
        long now = System.currentTimeMillis();
        Deque<Long> times = pings.computeIfAbsent(account.getUsername(), k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() >= PING_WINDOW_MS) times.pollFirst();
            if (times.size() >= MAX_PINGS) throw ApiException.tooManyRequests("Calma: espere um instante antes de marcar de novo.");
            times.addLast(now);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("x", x);
        data.put("y", y);
        data.put("from", account.getUsername());
        data.put("who", journal.nameOf(account));
        return new SignalResult(hub.send("map-ping", data, username -> true));
    }

    private static int coordinate(Integer value) {
        if (value == null) throw ApiException.badRequest("Informe x e y.");
        if (Math.abs(value) > LIMIT) throw ApiException.badRequest("Esse lugar fica fora do mapa.");
        return value;
    }
}
