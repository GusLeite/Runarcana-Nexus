package gusleite.runarcana_nexus.rules;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

// Capítulo 10 (rules/magias.json): custo de Mana por nível de magia, elementos, Mistérios e a lista de magias.
// - manaCost: nível da magia (0 a 9) → pontos de Mana. Truque (0) não gasta Mana.
// - elements: tier PRIMARY, SECONDARY, TRANSITION, PRIMORDIAL ou TERTIARY. access = caminhos alternativos para ter
//   acesso ao elemento; cada caminho é a lista de exigências (todas): outro elemento manifesto ou "heritage:<id>".
//   Sem access (primários), o acesso é livre. damage e material: tipo de dano e componente das magias de "qualquer" elemento.
// - mysteries: source CELESTIAL, ELEMENTAL ou SPIRITUAL; element liga o Mistério Elemental ao elemento.
//   optionalAccess: elementos liberados pela regra opcional "Acesso aos Elementos" (Mistérios Espirituais).
// - damageEffects: efeito extra das magias elementais pelo tipo de dano.
public record RuleMagic(
        Map<String, Integer> manaCost,
        List<Element> elements,
        List<Mystery> mysteries,
        List<DamageEffect> damageEffects,
        // Lido do arquivo, mas fora do GET /creation/catalog (são ~560 magias): a lista sai em GET /creation/spells.
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) List<Spell> spells,
        // Lista de Rituais (não confundir com magias de descritor Ritual, que estão em spells com ritual = true).
        List<Ritual> rituals,
        // Tabelas de consulta do capítulo: Conjuração Ritual, Trespassando, Rituais, Magia Púrpura, Magia Descontrolada
        // Yordle, Essência e Golem. Cada linha tem uma célula por coluna.
        List<Table> tables
) {
    public List<Ritual> ritualsOrEmpty() {
        return rituals == null ? List.of() : rituals;
    }

    public List<Table> tablesOrEmpty() {
        return tables == null ? List.of() : tables;
    }

    public List<Element> elementsOrEmpty() {
        return elements == null ? List.of() : elements;
    }

    public List<Mystery> mysteriesOrEmpty() {
        return mysteries == null ? List.of() : mysteries;
    }

    public List<Spell> spellsOrEmpty() {
        return spells == null ? List.of() : spells;
    }

    public record Element(String id, String name, String tier, String damage, String material, String description,
                          List<List<String>> access) {}

    public record Mystery(String id, String name, String source, String element, String description, List<String> optionalAccess) {}

    public record DamageEffect(String damage, String effect) {}

    // Um ritual da Lista de Rituais. level 1 a 6 (CD, sucessos, custo e tempo vêm da tabela "rituais");
    // skills: ARCANA, NATURE ou RELIGION; subclasses: Ritos do Acólito exigidos (prerequisite é o texto do livro);
    // backlashAt: com esse número de sucessos ou menos, além de falhar, acontece o rebote (backlash).
    public record Ritual(String id, String name, Integer level, List<String> skills, String prerequisite, List<String> subclasses,
                         Integer backlashAt, String backlash, String language, String duration, String components,
                         String description) {
        public List<String> subclassesOrEmpty() {
            return subclasses == null ? List.of() : subclasses;
        }
    }

    public record Table(String id, String name, String description, List<String> columns, List<List<String>> rows) {
        public List<List<String>> rowsOrEmpty() {
            return rows == null ? List.of() : rows;
        }
    }

    // Uma magia da lista. mysteries: ids dos Mistérios que a trazem ("qualquer" elemento: "elemental-geral"); vazio nas
    // magias "Especiais" (as do 20º nível dos Glifos), que dizem no texto quem as tem.
    // classes: listas de classe em que ela está ("Feitiços de Acólito" → ACOLYTE). origins: listas de origem ou
    // linhagem ("Feitiços de Yordle" → yordle, "Feitiços de Fauhwoon" → fauhwoon).
    public record Spell(String id, String name, Integer level, List<String> mysteries, List<String> classes, List<String> origins,
                        String castingTime, String range, String components, String material, String duration,
                        Boolean concentration, Boolean ritual, String description, String higherLevels) {
        public List<String> mysteriesOrEmpty() {
            return mysteries == null ? List.of() : mysteries;
        }

        public List<String> classesOrEmpty() {
            return classes == null ? List.of() : classes;
        }

        public List<String> originsOrEmpty() {
            return origins == null ? List.of() : origins;
        }
    }
}
