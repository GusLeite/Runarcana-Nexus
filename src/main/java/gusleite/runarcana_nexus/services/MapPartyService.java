package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.map.PartyTrailPoint;
import gusleite.runarcana_nexus.model.settings.TableSetting;
import gusleite.runarcana_nexus.repository.PartyTrailPointRepository;
import gusleite.runarcana_nexus.repository.TableSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.TreeSet;
import java.util.regex.Pattern;

// O grupo no mapa: onde está o marcador (o mestre move), a trilha da viagem e a névoa de guerra por região.
// Posição, névoa e regiões reveladas ficam em TableSetting; a trilha, em PartyTrailPoint.
@Service
public class MapPartyService {

    static final String PARTY = "map.party";
    static final String FOG = "map.fog";
    static final String REVEALED = "map.revealed";
    static final int MAX_TRAIL = 200;
    static final int MAP_HALF = 1024;
    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z-]{0,39}$");

    private final TableSettingRepository settings;
    private final PartyTrailPointRepository trail;

    public MapPartyService(TableSettingRepository settings, PartyTrailPointRepository trail) {
        this.settings = settings;
        this.trail = trail;
    }

    public record MoveRequest(Integer x, Integer y, String label) {}

    public record TrailPoint(int x, int y, String label, Instant createdAt) {}

    // x/y nulos = o marcador não está no mapa. fog desligada = tudo à vista.
    public record PartyView(Integer x, Integer y, List<TrailPoint> trail, boolean fog, List<String> revealed) {}

    @Transactional(readOnly = true)
    public PartyView view() {
        int[] at = settings.findById(PARTY).map(s -> Arrays.stream(s.getValue().split(",")).mapToInt(Integer::parseInt).toArray()).orElse(null);
        return new PartyView(at == null ? null : at[0], at == null ? null : at[1],
                trail.findAllByOrderByIdAsc().stream().map(p -> new TrailPoint(p.getX(), p.getY(), p.getLabel(), p.getCreatedAt())).toList(),
                fogOn(), List.copyOf(revealed()));
    }

    // Move o marcador e, se mudou de lugar, abre uma parada nova na trilha (as mais antigas saem depois de MAX_TRAIL).
    @Transactional
    public PartyView move(MoveRequest r) {
        if (r == null || r.x() == null || r.y() == null || Math.abs(r.x()) > MAP_HALF || Math.abs(r.y()) > MAP_HALF) {
            throw ApiException.badRequest("Esse lugar fica fora do mapa.");
        }
        String label = r.label() == null || r.label().isBlank() ? null : r.label().trim();
        if (label != null && label.length() > 80) throw ApiException.badRequest("O nome da parada vai até 80 caracteres.");
        settings.save(new TableSetting(PARTY, r.x() + "," + r.y()));
        boolean same = trail.findFirstByOrderByIdDesc().map(p -> p.getX() == r.x() && p.getY() == r.y()).orElse(false);
        if (!same) {
            PartyTrailPoint p = new PartyTrailPoint();
            p.setX(r.x());
            p.setY(r.y());
            p.setLabel(label);
            p.setCreatedAt(Instant.now());
            trail.save(p);
            List<PartyTrailPoint> all = trail.findAllByOrderByIdAsc();
            if (all.size() > MAX_TRAIL) trail.deleteAll(all.subList(0, all.size() - MAX_TRAIL));
        }
        return view();
    }

    // Tira o marcador do mapa (a trilha fica).
    @Transactional
    public PartyView hide() {
        settings.deleteById(PARTY);
        return view();
    }

    // Apaga a trilha; se o grupo está no mapa, ela recomeça de onde ele está.
    @Transactional
    public PartyView clearTrail() {
        trail.deleteAllInBatch();
        PartyView now = view();
        if (now.x() != null) {
            PartyTrailPoint p = new PartyTrailPoint();
            p.setX(now.x());
            p.setY(now.y());
            p.setCreatedAt(Instant.now());
            trail.save(p);
        }
        return view();
    }

    @Transactional
    public PartyView setFog(Boolean enabled) {
        if (enabled == null) throw ApiException.badRequest("Diga se a névoa fica ligada.");
        settings.save(new TableSetting(FOG, enabled ? "on" : "off"));
        return view();
    }

    @Transactional
    public PartyView reveal(String slug, Boolean revealed) {
        if (slug == null || !SLUG.matcher(slug).matches()) throw ApiException.badRequest("Região desconhecida.");
        if (revealed == null) throw ApiException.badRequest("Diga se a região fica revelada.");
        TreeSet<String> set = revealed();
        if (revealed) set.add(slug);
        else set.remove(slug);
        settings.save(new TableSetting(REVEALED, String.join(",", set)));
        return view();
    }

    private boolean fogOn() {
        return settings.findById(FOG).map(s -> "on".equals(s.getValue())).orElse(false);
    }

    private TreeSet<String> revealed() {
        TreeSet<String> set = new TreeSet<>();
        settings.findById(REVEALED).ifPresent(s -> Arrays.stream(s.getValue().split(",")).filter(v -> !v.isBlank()).forEach(set::add));
        return set;
    }
}
