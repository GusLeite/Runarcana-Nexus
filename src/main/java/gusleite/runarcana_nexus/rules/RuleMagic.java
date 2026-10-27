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
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) List<Spell> spells
) {
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
