package gusleite.runarcana_nexus.record;

import java.util.List;

// Prévia da subida de nível: a ficha recalculada no nível novo (preview, com as escolhas e os erros) e o que muda.
// newLevel: o nível que a ficha vai ter; hpGain: diferença de PV máximo, somada também ao PV atual ao aplicar.
// attributeChanges: "FOR 16 → 18". newFeatures: habilidades que aparecem nesse nível (nome e fonte).
public record LevelUpPreview(CreationPreview preview, int currentLevel, int newLevel, int currentMaxHp, int newMaxHp,
                             int hpGain, List<String> attributeChanges, List<CreationPreview.FeatureLine> newFeatures) {}
