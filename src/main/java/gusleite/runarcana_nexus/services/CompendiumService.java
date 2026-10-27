package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.rules.RuleCompendium;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Páginas de consulta do livro (rules/compendio.json), lidas e conferidas ao subir como o catálogo de regras.
@Service
public class CompendiumService {

    private final RuleCompendium compendium;

    public CompendiumService(ResourceLoader resources,
                             @Value("${runarcana.rules.compendium:classpath:rules/compendio.json}") String location) {
        this.compendium = RuleCatalogService.load(resources.getResource(location), location, RuleCompendium.class);
        List<String> problems = validate(compendium);
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Compêndio inválido em " + location + ":\n - " + String.join("\n - ", problems));
        }
    }

    public RuleCompendium compendium() {
        return compendium;
    }

    static List<String> validate(RuleCompendium c) {
        List<String> p = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (RuleCompendium.Page page : c.pagesOrEmpty()) {
            if (page.id() == null || page.id().isBlank() || page.title() == null) p.add("compêndio: cada página precisa de id e title");
            else if (!ids.add(page.id())) p.add("página " + page.id() + ": id repetido");
            for (RuleCompendium.Section s : page.sectionsOrEmpty()) {
                if (s.depth() == null || s.depth() < 1 || s.depth() > 5) p.add("página " + page.id() + ": depth deve ir de 1 a 5");
                for (RuleCompendium.Table t : s.tablesOrEmpty()) {
                    if (t.columns() == null || t.columns().isEmpty()) p.add("página " + page.id() + ": tabela sem columns");
                    else if (t.rows() != null) t.rows().stream().filter(r -> r.size() != t.columns().size())
                            .forEach(r -> p.add("página " + page.id() + ", tabela " + t.name() + ": linha com " + r.size() + " células"));
                }
            }
        }
        return p;
    }
}
