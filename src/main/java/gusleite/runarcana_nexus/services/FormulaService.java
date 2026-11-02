package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleFormulas;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

// Fórmulas de Ofício (rules/formulas.json, conferido ao subir). As conhecidas ficam na ficha como "<ofício>:<fórmula>";
// quem marca é o mestre (decisão da mesa: a ficha pronta é dele). As de nível 0 todo mundo com o ofício conhece.
@Service
public class FormulaService {

    private final RuleFormulas catalog;
    private final CharacterRepository characters;
    private final RuleCatalogService rules;

    public FormulaService(ResourceLoader resources, CharacterRepository characters, RuleCatalogService rules,
                          @Value("${runarcana.rules.formulas:classpath:rules/formulas.json}") String location) {
        this.characters = characters;
        this.rules = rules;
        this.catalog = RuleCatalogService.load(resources.getResource(location), location, RuleFormulas.class);
        List<String> problems = validate(catalog);
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Fórmulas inválidas em " + location + ":\n - " + String.join("\n - ", problems));
        }
    }

    public RuleFormulas catalog() {
        return catalog;
    }

    public Optional<RuleFormulas.Formula> find(String key) {
        int at = key == null ? -1 : key.indexOf(':');
        if (at < 0) return Optional.empty();
        return catalog.craftsOrEmpty().getOrDefault(key.substring(0, at), List.of()).stream()
                .filter(f -> f.id().equals(key.substring(at + 1))).findFirst();
    }

    // Mestre: as fórmulas conhecidas da ficha (a lista substitui a atual). Só de ofícios que a ficha tem.
    @Transactional
    public CharacterResponse setKnown(long characterId, Collection<String> keys) {
        Character c = characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        Set<String> crafts = new HashSet<>();
        for (RuleCatalog.Craft k : rules.catalog().craftsOrEmpty()) {
            if (c.getCrafts().stream().anyMatch(n -> n.equalsIgnoreCase(k.name()))) crafts.add(k.id());
        }
        Set<String> out = new LinkedHashSet<>();
        for (String key : keys == null ? List.<String>of() : keys) {
            if (find(key).isEmpty()) throw ApiException.badRequest("Fórmula desconhecida: " + key + ".");
            if (!crafts.contains(key.substring(0, key.indexOf(':')))) throw ApiException.badRequest("A ficha não tem o ofício da fórmula " + key + ".");
            out.add(key);
        }
        c.getFormulas().clear();
        c.getFormulas().addAll(out);
        return CharacterResponse.of(c);
    }

    static List<String> validate(RuleFormulas c) {
        List<String> p = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (RuleFormulas.Formula f : c.generalOrEmpty()) {
            if (f.id() == null || f.name() == null) p.add("fórmula geral sem id ou name");
            else if (!ids.add("general:" + f.id())) p.add("fórmula geral " + f.id() + ": id repetido");
        }
        c.craftsOrEmpty().forEach((craft, list) -> {
            for (RuleFormulas.Formula f : list) {
                if (f.id() == null || f.name() == null || f.level() == null) p.add("ofício " + craft + ": fórmula sem id, name ou level");
                else if (!ids.add(craft + ":" + f.id())) p.add("ofício " + craft + ": fórmula " + f.id() + " repetida");
            }
        });
        return p;
    }
}
