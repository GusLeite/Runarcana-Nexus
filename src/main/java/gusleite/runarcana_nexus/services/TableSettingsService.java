package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.settings.TableSetting;
import gusleite.runarcana_nexus.record.TableSettingsResponse;
import gusleite.runarcana_nexus.repository.TableSettingRepository;
import gusleite.runarcana_nexus.rules.RuleTraits;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Configurações da mesa que o mestre define e o assistente de criação respeita.
@Service
public class TableSettingsService {

    // Modo de traços da Runinata travado pelo mestre (id de budgets do tracos.json). Sem valor = o jogador escolhe.
    static final String RUNINATA_BUDGET = "runinata.traitBudget";

    private final TableSettingRepository settings;
    private final RuleCatalogService rules;

    public TableSettingsService(TableSettingRepository settings, RuleCatalogService rules) {
        this.settings = settings;
        this.rules = rules;
    }

    @Transactional(readOnly = true)
    public TableSettingsResponse get() {
        return new TableSettingsResponse(lockedTraitBudget());
    }

    @Transactional(readOnly = true)
    public String lockedTraitBudget() {
        return settings.findById(RUNINATA_BUDGET).map(TableSetting::getValue).orElse(null);
    }

    // traitBudget nulo ou vazio destrava (o jogador volta a escolher).
    @Transactional
    public TableSettingsResponse update(String traitBudget) {
        if (traitBudget == null || traitBudget.isBlank()) {
            settings.deleteById(RUNINATA_BUDGET);
        } else {
            RuleTraits traits = rules.catalog().traits();
            boolean exists = traits != null && traits.budgetsOrEmpty().stream().anyMatch(b -> b.id().equals(traitBudget));
            if (!exists) throw ApiException.badRequest("Modo de traços desconhecido.");
            settings.save(new TableSetting(RUNINATA_BUDGET, traitBudget));
        }
        return get();
    }
}
