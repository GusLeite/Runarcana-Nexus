package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.record.CreationRequest.LevelPick;

import java.util.List;

// Subida de nível pelo mestre: os níveis novos (normalmente um), somados aos que a ficha já tem no build.
public record LevelUpRequest(List<LevelPick> levels) {
    public List<LevelPick> levelsOrEmpty() {
        return levels == null ? List.of() : levels;
    }
}
