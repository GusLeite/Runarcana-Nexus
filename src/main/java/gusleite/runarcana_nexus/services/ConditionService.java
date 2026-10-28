package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.rules.RuleConditions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

// Condições (rules/condicoes.json, conferido ao subir) e os testes contra a morte. Decisão da mesa: condições e
// Exaustão são do mestre; os testes contra a morte, o jogador marca (e o mestre ajusta).
@Service
public class ConditionService {

    private final RuleConditions catalog;
    private final CharacterRepository characters;

    public ConditionService(ResourceLoader resources, CharacterRepository characters,
                            @Value("${runarcana.rules.conditions:classpath:rules/condicoes.json}") String location) {
        this.characters = characters;
        this.catalog = RuleCatalogService.load(resources.getResource(location), location, RuleConditions.class);
        List<String> problems = validate(catalog);
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Condições inválidas em " + location + ":\n - " + String.join("\n - ", problems));
        }
    }

    public RuleConditions catalog() {
        return catalog;
    }

    public int exhaustionMax() {
        return catalog.exhaustionMax() == null ? 10 : catalog.exhaustionMax();
    }

    // Mestre: liga/desliga condições (ids do catálogo) e define a Exaustão (0 até o máximo). Nulos = mantém.
    @Transactional
    public CharacterResponse setConditions(long characterId, Collection<String> ids, Integer exhaustion) {
        Character c = characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        if (ids != null) {
            Set<String> known = new HashSet<>();
            catalog.conditionsOrEmpty().forEach(k -> known.add(k.id()));
            for (String id : ids) if (!known.contains(id)) throw ApiException.badRequest("Condição desconhecida: " + id + ".");
            c.getConditions().clear();
            c.getConditions().addAll(new LinkedHashSet<>(ids));
        }
        if (exhaustion != null) {
            if (exhaustion < 0 || exhaustion > exhaustionMax()) {
                throw ApiException.badRequest("A Exaustão vai de 0 a " + exhaustionMax() + ".");
            }
            c.setExhaustion(exhaustion);
        }
        return CharacterResponse.of(c);
    }

    // Testes contra a morte (0–3 cada). Jogador: só na própria ficha; mestre: em qualquer uma.
    @Transactional
    public CharacterResponse setDeathSaves(Character c, Integer successes, Integer failures) {
        if (successes == null || failures == null) throw ApiException.badRequest("Informe sucessos e falhas.");
        if (successes < 0 || successes > 3 || failures < 0 || failures > 3) {
            throw ApiException.badRequest("Sucessos e falhas vão de 0 a 3.");
        }
        c.setDeathSuccesses(successes);
        c.setDeathFailures(failures);
        characters.save(c);
        return CharacterResponse.of(c);
    }

    @Transactional
    public CharacterResponse setDeathSaves(long characterId, Integer successes, Integer failures) {
        Character c = characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        return setDeathSaves(c, successes, failures);
    }

    static List<String> validate(RuleConditions c) {
        List<String> p = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (RuleConditions.Condition k : c.conditionsOrEmpty()) {
            if (k.id() == null || k.id().isBlank() || k.name() == null || k.text() == null) p.add("condição sem id, name ou text");
            else if (!ids.add(k.id())) p.add("condição " + k.id() + ": id repetido");
        }
        if (c.exhaustionMax() != null && c.exhaustionMax() < 1) p.add("exhaustionMax precisa ser 1 ou mais");
        return p;
    }
}
