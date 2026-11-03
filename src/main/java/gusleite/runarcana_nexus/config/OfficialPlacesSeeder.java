package gusleite.runarcana_nexus.config;

import gusleite.runarcana_nexus.model.map.MapPoi;
import gusleite.runarcana_nexus.repository.MapPoiRepository;
import gusleite.runarcana_nexus.services.OfficialPlaces;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

// Cria, escondidos, os lugares do mapa oficial que ainda não existem (por chave). Lugares novos do catálogo entram
// nas atualizações seguintes; o que o mestre já mexeu (posição, texto, revelado) não é sobrescrito.
@Component
@ConditionalOnProperty(name = "runarcana.official-places.seed", havingValue = "true", matchIfMissing = true)
public class OfficialPlacesSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(OfficialPlacesSeeder.class);

    private final MapPoiRepository pois;

    public OfficialPlacesSeeder(MapPoiRepository pois) {
        this.pois = pois;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Set<String> have = pois.findByOfficialKeyIsNotNull().stream().map(MapPoi::getOfficialKey).collect(Collectors.toSet());
        int added = 0;
        for (OfficialPlaces.Place place : OfficialPlaces.ALL) {
            if (have.contains(place.key())) continue;
            MapPoi poi = new MapPoi();
            poi.setOfficialKey(place.key());
            poi.setRegionSlug(place.region());
            poi.setName(place.name());
            poi.setKind(place.kind());
            poi.setDescription(place.description());
            poi.setX(place.x());
            poi.setY(place.y());
            pois.save(poi);
            added++;
        }
        if (added > 0) log.info("{} lugares do mapa oficial criados (escondidos até o mestre revelar).", added);
    }
}
