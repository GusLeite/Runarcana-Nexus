package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.settings.TableSetting;
import gusleite.runarcana_nexus.record.BandleRollResponse;
import gusleite.runarcana_nexus.repository.TableSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

// Estado do mapa compartilhado pela mesa: onde Bandópolis surgiu.
@Service
public class MapService {

    static final String BANDLE_ROLL = "map.bandleRoll";
    static final int BANDLE_DIE = 10;

    private final TableSettingRepository settings;
    private final SecureRandom random = new SecureRandom();

    public MapService(TableSettingRepository settings) {
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public BandleRollResponse bandle() {
        return new BandleRollResponse(settings.findById(BANDLE_ROLL).map(s -> Integer.valueOf(s.getValue())).orElse(null));
    }

    // A rolagem é feita aqui, e não no navegador, e substitui a anterior.
    @Transactional
    public BandleRollResponse rollBandle() {
        int roll = random.nextInt(BANDLE_DIE) + 1;
        settings.save(new TableSetting(BANDLE_ROLL, String.valueOf(roll)));
        return new BandleRollResponse(roll);
    }
}
