package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.enums.UsesFormula;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.HeritageCondition;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleLineage;
import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.rules.RuleItems;
import gusleite.runarcana_nexus.rules.RuleMagic;
import gusleite.runarcana_nexus.rules.RuleLevel;
import gusleite.runarcana_nexus.rules.RuleOption;
import gusleite.runarcana_nexus.rules.RuleResource;
import gusleite.runarcana_nexus.rules.RuleTrait;
import gusleite.runarcana_nexus.rules.RuleTraits;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

// Carrega o catálogo de regras de criação (JSON) ao subir e confere tudo: um erro no arquivo
// impede a aplicação de subir, com a mensagem dizendo onde está o problema.
@Service
public class RuleCatalogService {

    private static final Pattern DICE = Pattern.compile("^\\d+d\\d+([+-]\\d+)?$");
    private static final Set<String> ATTRIBUTES = names(Attribute.values());
    private static final Set<String> SKILLS = names(SkillType.values());
    private static final Set<String> SIZES = names(CreatureSize.values());
    // Tipos de ponto de Herança (value da concessão HERITAGE_POINTS; sem value = ANY).
    static final Set<String> HERITAGE_SCOPES = Set.of("REGION", "ORIGIN", "GENERAL", "ANY");
    static final Set<String> TRAIT_TIERS = Set.of("MINOR", "MAJOR", "SUPERIOR");
    // Armaduras das proficiências (ARMOR_PROFICIENCY) e do requiresArmor das CAs alternativas.
    static final Set<String> ARMOR_TYPES = Set.of("LIGHT", "MEDIUM", "HEAVY", "SHIELD");
    // Tipo de deslocamento da concessão SPEED (sem value = WALK; ALL = todos os deslocamentos que o personagem tiver).
    static final Set<String> SPEED_TYPES = Set.of("WALK", "SWIM", "CLIMB", "FLY", "BURROW", "ALL");
    // Escolhas: não aceitam "when" (só concessões fixas são decididas depois das escolhas).
    static final Set<GrantType> CHOICE_TYPES = java.util.EnumSet.of(GrantType.ATTRIBUTE_CHOICE, GrantType.SKILL_CHOICE, GrantType.SIZE_CHOICE,
            GrantType.CRAFT_CHOICE, GrantType.LANGUAGE_CHOICE, GrantType.PROFICIENCY_CHOICE, GrantType.EXPERTISE_CHOICE,
            GrantType.SAVING_THROW_CHOICE, GrantType.EQUIPMENT_CHOICE, GrantType.SPELL_CHOICE, GrantType.RESOURCE_CHOICE, GrantType.HERITAGE_POINTS);
    private static final Set<String> CRAFT_KINDS = Set.of("MAJOR", "MINOR");
    // Tipos de recurso de classe (rules/recursos.json e value da concessão RESOURCE_CHOICE).
    static final Set<String> RESOURCE_KINDS = Set.of("IRA", "SUTRA", "VEL", "TECNICA", "INVOCACAO", "GRANDE_ESPIRITO",
            "ASPECTO_TERRESTRE", "ASPECTO_AQUATICO", "ASPECTO_ALADO", "RUNA", "APRIMORAMENTO");

    private final RuleCatalog catalog;

    public RuleCatalogService(ResourceLoader resources,
                              @Value("${runarcana.rules.catalog:classpath:rules/criacao.json}") String location,
                              @Value("${runarcana.rules.heritages:classpath:rules/herancas.json}") String heritagesLocation,
                              @Value("${runarcana.rules.traits:classpath:rules/tracos.json}") String traitsLocation,
                              @Value("${runarcana.rules.resources:classpath:rules/recursos.json}") String resourcesLocation,
                              @Value("${runarcana.rules.magic:classpath:rules/magias.json}") String magicLocation,
                              @Value("${runarcana.rules.items:classpath:rules/itens.json}") String itemsLocation,
                              @Value("${runarcana.rules.feats:classpath:rules/aprimoramentos.json}") String featsLocation) {
        RuleCatalog base = load(resources.getResource(location), location, RuleCatalog.class);
        HeritageFile heritages = load(resources.getResource(heritagesLocation), heritagesLocation, HeritageFile.class);
        RuleTraits traits = load(resources.getResource(traitsLocation), traitsLocation, RuleTraits.class);
        ResourceFile classResources = load(resources.getResource(resourcesLocation), resourcesLocation, ResourceFile.class);
        RuleMagic magic = load(resources.getResource(magicLocation), magicLocation, RuleMagic.class);
        RuleItems items = load(resources.getResource(itemsLocation), itemsLocation, RuleItems.class);
        // Aprimoramentos (Capítulo 5, Personalização): recursos kind APRIMORAMENTO num arquivo à parte.
        ResourceFile feats = load(resources.getResource(featsLocation), featsLocation, ResourceFile.class);
        List<RuleResource> allResources = new ArrayList<>(classResources.resources() == null ? List.of() : classResources.resources());
        if (feats.resources() != null) allResources.addAll(feats.resources());
        this.catalog = base.withHeritages(heritages.heritages()).withTraits(traits).withResources(allResources)
                .withMagic(magic).withEquipment(items);
        List<String> problems = validate(catalog);
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Regras de criação inválidas em " + location + " / " + heritagesLocation
                    + " / " + traitsLocation + " / " + resourcesLocation + " / " + magicLocation + " / " + itemsLocation
                    + " / " + featsLocation + ":\n - " + String.join("\n - ", problems));
        }
    }

    // Formato do rules/herancas.json: { "heritages": [ ... ] }.
    record HeritageFile(List<RuleHeritage> heritages) {}

    // Formato do rules/recursos.json: { "resources": [ ... ] }.
    record ResourceFile(List<RuleResource> resources) {}

    public RuleCatalog catalog() {
        return catalog;
    }

    public Optional<RuleOption> origin(String id) {
        return find(catalog.origins(), id);
    }

    public Optional<RuleOption> background(String id) {
        return find(catalog.backgrounds(), id);
    }

    public Optional<RuleOption> region(String id) {
        return find(catalog.regions(), id);
    }

    public Optional<RuleClass> characterClass(String id) {
        if (id == null || catalog.classes() == null) return Optional.empty();
        return catalog.classes().stream().filter(c -> c.id().equalsIgnoreCase(id)).findFirst();
    }

    public Optional<RuleHeritage> heritage(String id) {
        if (id == null) return Optional.empty();
        return catalog.heritagesOrEmpty().stream().filter(h -> h.id().equalsIgnoreCase(id)).findFirst();
    }

    public Optional<RuleResource> resource(String id) {
        if (id == null) return Optional.empty();
        return catalog.resourcesOrEmpty().stream().filter(r -> r.id().equalsIgnoreCase(id)).findFirst();
    }

    // Recursos de um tipo (SUTRA, IRA...), na ordem do arquivo.
    public List<RuleResource> resources(String kind) {
        return catalog.resourcesOrEmpty().stream().filter(r -> r.kind().equals(kind)).toList();
    }

    public Optional<RuleTrait> trait(String id) {
        return findTrait(catalog.traits() == null ? List.of() : catalog.traits().traitsOrEmpty(), id);
    }

    public Optional<RuleTrait> drawback(String id) {
        return findTrait(catalog.traits() == null ? List.of() : catalog.traits().drawbacksOrEmpty(), id);
    }

    private static Optional<RuleTrait> findTrait(List<RuleTrait> list, String id) {
        if (id == null) return Optional.empty();
        return list.stream().filter(t -> t.id().equalsIgnoreCase(id)).findFirst();
    }

    public boolean roundsUp() {
        return "UP".equalsIgnoreCase(catalog.rounding());
    }

    private static Optional<RuleOption> find(List<RuleOption> list, String id) {
        if (id == null || list == null) return Optional.empty();
        return list.stream().filter(o -> o.id().equalsIgnoreCase(id)).findFirst();
    }

    static <T> T load(Resource resource, String location, Class<T> type) {
        // Estrito: chave escrita errada no JSON vira erro, em vez de ser ignorada em silêncio.
        JsonMapper mapper = JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
        try (InputStream in = resource.getInputStream()) {
            return mapper.readValue(in, type);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler as regras de criação em " + location, e);
        } catch (RuntimeException e) {
            throw new IllegalStateException("JSON inválido nas regras de criação (" + location + "): " + e.getMessage(), e);
        }
    }

    // ---------- validação ----------

    static List<String> validate(RuleCatalog c) {
        List<String> p = new ArrayList<>();
        if (c.attributeMethods() == null) {
            p.add("faltou attributeMethods");
        } else {
            validateMethods(c.attributeMethods(), p);
        }
        if (c.rounding() != null && !Set.of("DOWN", "UP").contains(c.rounding())) {
            p.add("rounding deve ser DOWN ou UP");
        }

        Set<String> crafts = new HashSet<>();
        for (RuleCatalog.Craft craft : c.craftsOrEmpty()) {
            if (blank(craft.id()) || blank(craft.name())) p.add("ofícios: cada um precisa de id e name");
            else if (!crafts.add(craft.id())) p.add("ofícios " + craft.id() + ": id repetido");
            if (craft.kind() != null && !CRAFT_KINDS.contains(craft.kind())) p.add("ofícios " + craft.id() + ": kind deve ser MAJOR ou MINOR");
        }

        validateOptions("origens", c.origins(), p, null, crafts);
        validateOptions("passados", c.backgrounds(), p, null, crafts);
        validateOptions("regiões", c.regions(), p, names(Region.values()), crafts);

        Set<String> classIds = new HashSet<>();
        for (RuleClass k : c.classes() == null ? List.<RuleClass>of() : c.classes()) {
            String where = "classe " + k.id();
            if (k.id() == null || !names(CharacterClassType.values()).contains(k.id())) {
                p.add(where + ": id deve ser um destes: " + Arrays.toString(CharacterClassType.values()));
            }
            if (!classIds.add(String.valueOf(k.id()))) p.add(where + ": id repetido");
            if (blank(k.name())) p.add(where + ": falta name");
            if (k.hitDie() == null || k.hitDie() < 2) p.add(where + ": hitDie deve ser o lado do dado de vida (ex.: 8)");
            validateGrants(where, k.grantsOrEmpty(), p, crafts);
            validateLevels(where, k.levelsOrEmpty(), p, crafts);
            if (k.multiclass() != null) {
                RuleClass.Multiclass m = k.multiclass();
                if (m.attributes() != null && m.attributes().values().stream().anyMatch(v -> v == null || v < 1 || v > 30))
                    p.add(where + ", multiclasse: valor de atributo inválido");
                if (m.anyAttributes() != null && m.anyAttributes().values().stream().anyMatch(v -> v == null || v < 1 || v > 30))
                    p.add(where + ", multiclasse: valor de atributo inválido");
                validateGrants(where + ", multiclasse", m.grantsOrEmpty(), p, crafts);
            }
            Set<String> subIds = new HashSet<>();
            for (RuleLineage sub : k.subclassesOrEmpty()) {
                String at = where + ", subclasse " + sub.id();
                if (blank(sub.id()) || blank(sub.name())) p.add(where + ": cada subclasse precisa de id e name");
                else if (!subIds.add(sub.id().toLowerCase())) p.add(at + ": id repetido");
                validateGrants(at, sub.grantsOrEmpty(), p, crafts);
                validateLevels(at, sub.levelsOrEmpty(), p, crafts);
            }
        }
        Set<String> allLineages = new HashSet<>();
        for (RuleOption o : c.origins() == null ? List.<RuleOption>of() : c.origins()) {
            o.lineagesOrEmpty().forEach(l -> allLineages.add(String.valueOf(l.id()).toLowerCase()));
        }
        validateHeritages(c.heritagesOrEmpty(), p, crafts, allLineages);
        boolean anyTraitOrigin = c.origins() != null && c.origins().stream().anyMatch(RuleOption::usesTraitsOrFalse);
        if (anyTraitOrigin && (c.traits() == null || c.traits().budgetsOrEmpty().isEmpty())) {
            p.add("traços: há origem com usesTraits, mas o tracos.json não tem budgets");
        }
        if (c.traits() != null) validateTraits(c.traits(), p, crafts);
        validateGrants("Natureza Rúnica", c.runicNatureOrEmpty(), p, crafts);
        validateResources(c, p, crafts, classIds);
        if (c.magic() != null) validateMagic(c.magic(), p, c, classIds);
        validateEquipment(c, p, classIds);
        validateSpellGrants(c, p);
        return p;
    }

    // Capítulo 6: itens (tipo, id único, conteúdo dos conjuntos), riqueza inicial e as opções das concessões
    // EQUIPMENT/EQUIPMENT_CHOICE de origens, classes, subclasses e passados.
    static final Set<String> ITEM_KINDS = Set.of("WEAPON", "ARMOR", "SHIELD", "AMMUNITION", "GEAR", "FOCUS", "TOOLS",
            "INSTRUMENT", "MOUNT", "VEHICLE", "TACK", "PACK");
    private static final Set<String> DEXTERITY_RULES = Set.of("FULL", "MAX_2", "NONE");

    private static void validateEquipment(RuleCatalog c, List<String> p, Set<String> classIds) {
        RuleItems items = c.equipment();
        Set<String> ids = new HashSet<>();
        if (items != null) {
            for (RuleItem i : items.itemsOrEmpty()) {
                String where = "item " + i.id();
                if (blank(i.id()) || blank(i.name())) p.add("itens: cada item precisa de id e name");
                else if (!ids.add(i.id())) p.add(where + ": id repetido");
                if (i.kind() == null || !ITEM_KINDS.contains(i.kind())) p.add(where + ": kind deve ser um destes: " + ITEM_KINDS);
                if (i.armorWeight() != null && !ARMOR_TYPES.contains(i.armorWeight())) p.add(where + ": armorWeight deve ser LIGHT, MEDIUM ou HEAVY");
                if (i.dexterity() != null && !DEXTERITY_RULES.contains(i.dexterity())) p.add(where + ": dexterity deve ser um destes: " + DEXTERITY_RULES);
                if ("ARMOR".equals(i.kind()) && (i.armorClass() == null || i.armorWeight() == null)) p.add(where + ": armadura precisa de armorClass e armorWeight");
                if ("PACK".equals(i.kind()) && i.contentsOrEmpty().isEmpty()) p.add(where + ": conjunto sem contents");
            }
            for (RuleItem i : items.itemsOrEmpty()) {
                for (RuleItem.Content x : i.contentsOrEmpty()) {
                    if (x.item() == null && blank(x.name())) p.add("item " + i.id() + ": cada conteúdo precisa de item ou name");
                    else if (x.item() != null && !ids.contains(x.item())) p.add("item " + i.id() + ": conteúdo com item inexistente \"" + x.item() + "\"");
                }
            }
            if (items.startingWealth() != null) items.startingWealth().forEach((k, v) -> {
                if (!classIds.contains(k)) p.add("itens: riqueza inicial de classe desconhecida \"" + k + "\"");
                if (!EquipmentRules.validWealth(v)) p.add("itens: riqueza inicial de " + k + " deve ser como \"5d4 x 10\"");
            });
        }
        List<Map.Entry<String, Grant>> grants = new ArrayList<>();
        for (RuleOption o : c.origins() == null ? List.<RuleOption>of() : c.origins()) o.grantsOrEmpty().forEach(g -> grants.add(Map.entry("origem " + o.id(), g)));
        for (RuleOption o : c.backgrounds() == null ? List.<RuleOption>of() : c.backgrounds()) o.grantsOrEmpty().forEach(g -> grants.add(Map.entry("passado " + o.id(), g)));
        for (RuleClass k : c.classes() == null ? List.<RuleClass>of() : c.classes()) {
            k.grantsOrEmpty().forEach(g -> grants.add(Map.entry("classe " + k.id(), g)));
            k.subclassesOrEmpty().forEach(s -> s.grantsOrEmpty().forEach(g -> grants.add(Map.entry("classe " + k.id() + ", subclasse " + s.id(), g))));
        }
        for (Map.Entry<String, Grant> e : grants) {
            Grant g = e.getValue();
            List<String> options = g.type() == GrantType.EQUIPMENT && g.value() != null ? List.of(g.value())
                    : g.type() == GrantType.EQUIPMENT_CHOICE && g.options() != null ? g.options() : List.of();
            if (!options.isEmpty() && items == null) p.add(e.getKey() + ": equipamento sem catálogo de itens");
            else options.forEach(o -> EquipmentRules.problems(items, o).forEach(x -> p.add(e.getKey() + " (" + g.type() + "): " + x)));
        }
    }

    // De onde vêm as opções de SPELL_CHOICE.
    static final Set<String> SPELL_SOURCES = Set.of("CLASS", "MYSTERIES", "CLASS_OR_MYSTERIES");

    // MYSTERY, SPELL e FEATURE com value MYSTERY (as opções precisam ser nomes de Mistérios) em classes, subclasses,
    // origens, linhagens, passados, recursos e na Natureza Rúnica.
    private static void validateSpellGrants(RuleCatalog c, List<String> p) {
        List<Map.Entry<String, Grant>> grants = new ArrayList<>();
        for (RuleClass k : c.classes() == null ? List.<RuleClass>of() : c.classes()) {
            k.grantsOrEmpty().forEach(g -> grants.add(Map.entry("classe " + k.id(), g)));
            k.subclassesOrEmpty().forEach(s -> s.grantsOrEmpty().forEach(g -> grants.add(Map.entry("classe " + k.id() + ", subclasse " + s.id(), g))));
        }
        for (RuleOption o : c.origins() == null ? List.<RuleOption>of() : c.origins()) {
            o.grantsOrEmpty().forEach(g -> grants.add(Map.entry("origem " + o.id(), g)));
            o.lineagesOrEmpty().forEach(l -> l.grantsOrEmpty().forEach(g -> grants.add(Map.entry("origem " + o.id() + ", linhagem " + l.id(), g))));
        }
        for (RuleOption o : c.backgrounds() == null ? List.<RuleOption>of() : c.backgrounds()) o.grantsOrEmpty().forEach(g -> grants.add(Map.entry("passado " + o.id(), g)));
        c.resourcesOrEmpty().forEach(r -> r.grantsOrEmpty().forEach(g -> grants.add(Map.entry("recurso " + r.id(), g))));
        c.runicNatureOrEmpty().forEach(g -> grants.add(Map.entry("Natureza Rúnica", g)));
        c.heritagesOrEmpty().forEach(h -> h.grantsOrEmpty().forEach(g -> grants.add(Map.entry("herança " + h.id(), g))));
        RuleMagic m = c.magic();
        Set<String> mysteries = new HashSet<>(), names = new HashSet<>(), spells = new HashSet<>();
        if (m != null) {
            m.mysteriesOrEmpty().forEach(x -> { mysteries.add(x.id()); names.add(plain(x.name())); });
            m.spellsOrEmpty().forEach(s -> spells.add(s.id()));
        }
        for (Map.Entry<String, Grant> e : grants) {
            Grant g = e.getValue();
            if (g.type() == GrantType.MYSTERY && g.value() != null && !mysteries.contains(g.value())) p.add(e.getKey() + " (MYSTERY): Mistério inexistente \"" + g.value() + "\"");
            // Mistério à escolha: cada opção é um id de Mistério.
            if (g.type() == GrantType.MYSTERY && g.value() == null && g.hasOptions()) g.options().stream().filter(o -> !mysteries.contains(o))
                    .forEach(o -> p.add(e.getKey() + " (MYSTERY): Mistério inexistente \"" + o + "\""));
            if (g.type() == GrantType.MYSTERY && g.options() != null) g.options().stream().filter(o -> !mysteries.contains(o))
                    .forEach(o -> p.add(e.getKey() + " (MYSTERY): opção \"" + o + "\" não é um Mistério"));
            if (g.type() == GrantType.SPELL && !spells.contains(g.value())) p.add(e.getKey() + " (SPELL): magia inexistente \"" + g.value() + "\"");
            if (g.type() == GrantType.FEATURE && "MYSTERY".equals(g.value()) && g.options() != null) g.options().stream()
                    // "Água (Elemental)": o nome fora dos parênteses; "Charme (Encantamento)" (Vítreo): o de dentro.
                    .filter(o -> !names.contains(plain(o.replaceAll("\\s*\\(.*\\)$", "")).replace("infernal", "inferno"))
                            && !names.contains(plain(o.replaceAll("^.*\\(([^)]+)\\)$", "$1"))))
                    .forEach(o -> p.add(e.getKey() + " (" + g.name() + "): opção \"" + o + "\" não é um Mistério"));
        }
        // Pré-requisito de magia conhecida dos recursos (Rajada Etérea → rajada-mistica).
        if (m != null) c.resourcesOrEmpty().stream().filter(r -> r.requires() != null && r.requires().spells() != null)
                .forEach(r -> r.requires().spells().stream().filter(s -> !spells.contains(s))
                        .forEach(s -> p.add("recurso " + r.id() + ": requires.spells cita magia inexistente \"" + s + "\"")));
    }

    private static String plain(String s) {
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase().trim();
    }

    // Capítulo 10: tabela de Mana, elementos (e os caminhos de acesso), Mistérios e magias.
    private static void validateMagic(RuleMagic m, List<String> p, RuleCatalog c, Set<String> classIds) {
        if (m.manaCost() == null) p.add("magia: falta manaCost");
        else m.manaCost().forEach((lv, n) -> {
            if (!lv.matches("[0-9]")) p.add("magia: manaCost usa o nível da magia (0 a 9) como chave");
            if (n == null || n < 0) p.add("magia: manaCost precisa de valores 0 ou mais");
        });
        Set<String> tiers = Set.of("PRIMARY", "SECONDARY", "TRANSITION", "PRIMORDIAL", "TERTIARY");
        Set<String> elements = new HashSet<>();
        m.elementsOrEmpty().forEach(e -> {
            if (blank(e.id()) || blank(e.name())) p.add("magia: cada elemento precisa de id e name");
            else if (!elements.add(e.id())) p.add("elemento " + e.id() + ": id repetido");
            if (e.tier() == null || !tiers.contains(e.tier())) p.add("elemento " + e.id() + ": tier deve ser um destes: " + tiers);
        });
        Set<String> heritageIds = new HashSet<>();
        c.heritagesOrEmpty().forEach(h -> heritageIds.add(String.valueOf(h.id())));
        m.elementsOrEmpty().forEach(e -> (e.access() == null ? List.<List<String>>of() : e.access()).forEach(path -> path.forEach(t -> {
            boolean ok = t.startsWith(MagicRules.HERITAGE) ? heritageIds.contains(t.substring(MagicRules.HERITAGE.length())) : elements.contains(t);
            if (!ok) p.add("elemento " + e.id() + ": access cita \"" + t + "\" inexistente");
        })));
        Set<String> sources = Set.of("CELESTIAL", "ELEMENTAL", "SPIRITUAL");
        Set<String> mysteries = new HashSet<>();
        m.mysteriesOrEmpty().forEach(x -> {
            if (blank(x.id()) || blank(x.name())) p.add("magia: cada Mistério precisa de id e name");
            else if (!mysteries.add(x.id())) p.add("Mistério " + x.id() + ": id repetido");
            if (x.source() == null || !sources.contains(x.source())) p.add("Mistério " + x.id() + ": source deve ser um destes: " + sources);
            if (x.element() != null && !elements.contains(x.element())) p.add("Mistério " + x.id() + ": elemento inexistente \"" + x.element() + "\"");
            if (x.optionalAccess() != null) x.optionalAccess().stream().filter(e -> !elements.contains(e))
                    .forEach(e -> p.add("Mistério " + x.id() + ": optionalAccess cita elemento inexistente \"" + e + "\""));
        });
        Set<String> originIds = new HashSet<>();
        (c.origins() == null ? List.<RuleOption>of() : c.origins()).forEach(o -> {
            originIds.add(o.id());
            o.lineagesOrEmpty().forEach(l -> originIds.add(l.id()));
        });
        Set<String> spells = new HashSet<>();
        m.spellsOrEmpty().forEach(s -> {
            if (blank(s.id()) || blank(s.name())) p.add("magia: cada magia precisa de id e name");
            else if (!spells.add(s.id())) p.add("magia " + s.id() + ": id repetido");
            if (s.level() == null || s.level() < 0 || s.level() > 9) p.add("magia " + s.id() + ": level deve ir de 0 a 9");
            s.mysteriesOrEmpty().stream().filter(x -> !mysteries.contains(x))
                    .forEach(x -> p.add("magia " + s.id() + ": Mistério inexistente \"" + x + "\""));
            s.classesOrEmpty().stream().filter(x -> !classIds.contains(x))
                    .forEach(x -> p.add("magia " + s.id() + ": classe inexistente \"" + x + "\""));
            s.originsOrEmpty().stream().filter(x -> !originIds.contains(x))
                    .forEach(x -> p.add("magia " + s.id() + ": origem ou linhagem inexistente \"" + x + "\""));
        });
        Set<String> subclassIds = new HashSet<>();
        (c.classes() == null ? List.<RuleClass>of() : c.classes()).forEach(k -> k.subclassesOrEmpty().forEach(s -> subclassIds.add(s.id())));
        Set<String> ritualSkills = Set.of("ARCANA", "NATURE", "RELIGION");
        Set<String> rituals = new HashSet<>();
        m.ritualsOrEmpty().forEach(r -> {
            if (blank(r.id()) || blank(r.name())) p.add("ritual: cada ritual precisa de id e name");
            else if (!rituals.add(r.id())) p.add("ritual " + r.id() + ": id repetido");
            if (r.level() == null || r.level() < 1 || r.level() > 6) p.add("ritual " + r.id() + ": level deve ir de 1 a 6");
            if (r.skills() == null || r.skills().isEmpty() || !ritualSkills.containsAll(r.skills())) p.add("ritual " + r.id() + ": skills deve usar " + ritualSkills);
            r.subclassesOrEmpty().stream().filter(x -> !subclassIds.contains(x))
                    .forEach(x -> p.add("ritual " + r.id() + ": subclasse inexistente \"" + x + "\""));
        });
        Set<String> tables = new HashSet<>();
        m.tablesOrEmpty().forEach(t -> {
            if (blank(t.id()) || t.columns() == null || t.columns().isEmpty()) p.add("tabela de magia: precisa de id e columns");
            else if (!tables.add(t.id())) p.add("tabela " + t.id() + ": id repetido");
            else t.rowsOrEmpty().stream().filter(row -> row.size() != t.columns().size())
                    .forEach(row -> p.add("tabela " + t.id() + ": linha com " + row.size() + " células, esperado " + t.columns().size()));
        });
    }

    // Recursos de classe e as escolhas que apontam para eles (tipo e grupos existentes).
    private static void validateResources(RuleCatalog c, List<String> p, Set<String> crafts, Set<String> classIds) {
        Set<String> ids = new HashSet<>();
        c.resourcesOrEmpty().forEach(r -> ids.add(String.valueOf(r.id()).toLowerCase()));
        Set<String> heritageIds = new HashSet<>();
        c.heritagesOrEmpty().forEach(h -> heritageIds.add(String.valueOf(h.id()).toLowerCase()));
        Set<String> subclassIds = new HashSet<>();
        for (RuleClass k : c.classes() == null ? List.<RuleClass>of() : c.classes()) {
            k.subclassesOrEmpty().forEach(s -> subclassIds.add(String.valueOf(s.id()).toLowerCase()));
        }
        Set<String> originIds = new HashSet<>();
        Set<String> lineageIds = new HashSet<>();
        for (RuleOption o : c.origins() == null ? List.<RuleOption>of() : c.origins()) {
            originIds.add(String.valueOf(o.id()).toLowerCase());
            o.lineagesOrEmpty().forEach(l -> lineageIds.add(String.valueOf(l.id()).toLowerCase()));
        }
        Set<String> seen = new HashSet<>();
        for (RuleResource r : c.resourcesOrEmpty()) {
            String where = "recurso " + r.id();
            if (blank(r.id()) || blank(r.name())) p.add("recursos: cada um precisa de id e name");
            else if (!seen.add(r.id().toLowerCase())) p.add(where + ": id repetido");
            if (r.kind() == null || !RESOURCE_KINDS.contains(r.kind())) p.add(where + ": kind deve ser um destes: " + RESOURCE_KINDS);
            if (blank(r.description())) p.add(where + ": falta description");
            if (r.cost() != null && r.cost() < 1) p.add(where + ": cost deve ser 1 ou mais");
            if (r.ki() != null && r.ki() < 1) p.add(where + ": ki deve ser 1 ou mais");
            RuleResource.Requirements q = r.requires();
            if (q != null) {
                if (q.level() != null && (q.level() < 1 || q.level() > 20)) p.add(where + ": requires.level deve ir de 1 a 20");
                if (q.classes() != null) q.classes().stream().filter(x -> !classIds.contains(x))
                        .forEach(x -> p.add(where + ": classe desconhecida \"" + x + "\""));
                if (q.subclasses() != null) q.subclasses().stream().filter(x -> !subclassIds.contains(x.toLowerCase()))
                        .forEach(x -> p.add(where + ": subclasse desconhecida \"" + x + "\""));
                if (q.regions() != null) q.regions().stream().filter(x -> !names(Region.values()).contains(x))
                        .forEach(x -> p.add(where + ": região desconhecida \"" + x + "\""));
                if (q.skills() != null) q.skills().stream().filter(x -> !SKILLS.contains(x))
                        .forEach(x -> p.add(where + ": perícia desconhecida \"" + x + "\""));
                if (q.heritages() != null) q.heritages().stream().filter(x -> !heritageIds.contains(x.toLowerCase()))
                        .forEach(x -> p.add(where + ": herança inexistente \"" + x + "\""));
                if (q.armor() != null) q.armor().stream().filter(x -> !ARMOR_TYPES.contains(x))
                        .forEach(x -> p.add(where + ": armadura desconhecida \"" + x + "\""));
                if (q.resources() != null) q.resources().stream().filter(x -> !ids.contains(x.toLowerCase()))
                        .forEach(x -> p.add(where + ": recurso inexistente \"" + x + "\""));
                if (q.classLevel() != null && (q.classLevel() < 1 || q.classLevel() > 20 || q.classes() == null || q.classes().isEmpty()))
                    p.add(where + ": requires.classLevel vai de 1 a 20 e precisa de classes");
                if (q.origins() != null) q.origins().stream().filter(x -> !originIds.contains(x.toLowerCase()))
                        .forEach(x -> p.add(where + ": origem desconhecida \"" + x + "\""));
                if (q.lineages() != null) q.lineages().stream().filter(x -> !lineageIds.contains(x.toLowerCase()))
                        .forEach(x -> p.add(where + ": linhagem desconhecida \"" + x + "\""));
            }
            validateGrants(where, r.grantsOrEmpty(), p, crafts);
            validateLevels(where, r.levelsOrEmpty(), p, crafts);
        }
        // Escolhas de recurso nas classes, subclasses, ganhos por nível e nos próprios recursos.
        List<Map.Entry<String, Grant>> choices = new ArrayList<>();
        for (RuleClass k : c.classes() == null ? List.<RuleClass>of() : c.classes()) {
            k.grantsOrEmpty().forEach(g -> choices.add(Map.entry("classe " + k.id(), g)));
            k.levelsOrEmpty().forEach(l -> (l.grants() == null ? List.<Grant>of() : l.grants())
                    .forEach(g -> choices.add(Map.entry("classe " + k.id() + " nível " + l.level(), g))));
            for (RuleLineage sub : k.subclassesOrEmpty()) {
                sub.grantsOrEmpty().forEach(g -> choices.add(Map.entry("classe " + k.id() + ", subclasse " + sub.id(), g)));
                sub.levelsOrEmpty().forEach(l -> (l.grants() == null ? List.<Grant>of() : l.grants())
                        .forEach(g -> choices.add(Map.entry("classe " + k.id() + ", subclasse " + sub.id() + " nível " + l.level(), g))));
            }
        }
        c.resourcesOrEmpty().forEach(r -> r.grantsOrEmpty().forEach(g -> choices.add(Map.entry("recurso " + r.id(), g))));
        c.resourcesOrEmpty().forEach(r -> r.levelsOrEmpty().forEach(l -> (l.grants() == null ? List.<Grant>of() : l.grants())
                .forEach(g -> choices.add(Map.entry("recurso " + r.id() + " nível " + l.level(), g)))));
        c.runicNatureOrEmpty().forEach(g -> choices.add(Map.entry("Natureza Rúnica", g)));
        for (Map.Entry<String, Grant> e : choices) {
            Grant g = e.getValue();
            if (g.type() != GrantType.RESOURCE_CHOICE || g.value() == null) continue;
            Set<String> groups = new HashSet<>();
            c.resourcesOrEmpty().stream().filter(r -> g.value().equals(r.kind())).forEach(r -> groups.addAll(r.groupsOrEmpty()));
            if (g.options() != null) g.options().stream().filter(o -> !groups.contains(o))
                    .forEach(o -> p.add(e.getKey() + " (RESOURCE_CHOICE): nenhum recurso " + g.value() + " no grupo \"" + o + "\""));
        }
    }

    // Ganhos por nível (classe, origem ou linhagem): do 2º ao 20º, cada nível uma vez.
    private static void validateLevels(String where, List<RuleLevel> list, List<String> p, Set<String> crafts) {
        Set<Integer> levels = new HashSet<>();
        for (RuleLevel l : list) {
            if (l.level() == null || l.level() < 2 || l.level() > 20) p.add(where + ": nível deve ir de 2 a 20");
            else if (!levels.add(l.level())) p.add(where + ": nível " + l.level() + " repetido");
            validateGrants(where + " nível " + l.level(), l.grants() == null ? List.of() : l.grants(), p, crafts);
        }
    }

    private static void validateTraits(RuleTraits t, List<String> p, Set<String> crafts) {
        Set<String> budgets = new HashSet<>();
        for (RuleTraits.Budget b : t.budgetsOrEmpty()) {
            if (blank(b.id()) || blank(b.name())) p.add("traços: cada modo (budgets) precisa de id e name");
            else if (!budgets.add(b.id())) p.add("traços, modo " + b.id() + ": id repetido");
            if (b.minor() == null || b.minor() < 0 || b.major() == null || b.major() < 0) {
                p.add("traços, modo " + b.id() + ": minor e major devem ser 0 ou mais");
            }
        }
        for (String tier : TRAIT_TIERS) {
            if (t.costOf(tier) < 1) p.add("traços: costs precisa do custo de " + tier);
        }
        Set<String> ids = new HashSet<>();
        t.traitsOrEmpty().forEach(x -> ids.add(String.valueOf(x.id()).toLowerCase()));
        Set<String> seen = new HashSet<>();
        for (RuleTrait x : t.traitsOrEmpty()) {
            String where = "traço " + x.id();
            validateTraitCommon(x, where, seen, p, crafts);
            if (x.tier() == null || !TRAIT_TIERS.contains(x.tier())) p.add(where + ": tier deve ser MINOR, MAJOR ou SUPERIOR");
            x.requiresOrEmpty().stream().filter(r -> !ids.contains(r.toLowerCase()))
                    .forEach(r -> p.add(where + ": requires cita traço inexistente \"" + r + "\""));
        }
        for (RuleTrait x : t.drawbacksOrEmpty()) {
            String where = "desvantagem " + x.id();
            validateTraitCommon(x, where, seen, p, crafts);
            if (x.points() == null || x.points() <= 0) p.add(where + ": points deve ser maior que 0");
            if (x.tier() != null) p.add(where + ": desvantagem não tem tier");
        }
    }

    private static void validateTraitCommon(RuleTrait x, String where, Set<String> seen, List<String> p, Set<String> crafts) {
        if (blank(x.id())) p.add("traços: item sem id");
        else if (!seen.add(x.id().toLowerCase())) p.add(where + ": id repetido");
        if (blank(x.name())) p.add(where + ": falta name");
        if (blank(x.description())) p.add(where + ": falta description");
        if (x.maxTimes() != null && x.maxTimes() < 1) p.add(where + ": maxTimes deve ser 1 ou mais");
        validateGrants(where, x.grantsOrEmpty(), p, crafts);
    }

    private static void validateHeritages(List<RuleHeritage> list, List<String> p, Set<String> crafts, Set<String> lineages) {
        Set<String> ids = new HashSet<>();
        for (RuleHeritage h : list) ids.add(String.valueOf(h.id()).toLowerCase());
        Set<String> seen = new HashSet<>();
        Set<String> regions = names(Region.values());
        Set<String> classes = names(CharacterClassType.values());
        for (RuleHeritage h : list) {
            String where = "herança " + h.id();
            if (blank(h.id())) p.add("heranças: item sem id");
            else if (!seen.add(h.id().toLowerCase())) p.add(where + ": id repetido");
            if (blank(h.name())) p.add(where + ": falta name");
            if (blank(h.description())) p.add(where + ": falta description");
            validateGrants(where, h.grantsOrEmpty(), p, crafts);
            if (h.optionGrants() != null) h.optionGrants().forEach((option, optionList) -> {
                if (!h.optionsOrEmpty().contains(option)) p.add(where + ": optionGrants cita opção inexistente \"" + option + "\"");
                validateGrants(where + " (" + option + ")", optionList, p, crafts);
            });
            // FEATURE só para as partes ativas extras e as escolhas (o texto da Herança já vira a habilidade).
            h.grantsOrEmpty().stream().filter(g -> g.type() == GrantType.HERITAGE_POINTS)
                    .forEach(g -> p.add(where + ": grants não aceita " + g.type()));
            for (Map.Entry<String, ?> e : optionKeys(h).entrySet()) {
                if (!h.optionsOrEmpty().contains(e.getKey())) p.add(where + ": " + e.getValue() + " cita opção inexistente \"" + e.getKey() + "\"");
            }
            if (h.uses() != null && h.uses().usesFormula() == null && h.uses().maxUses() == null) p.add(where + ": uses precisa de usesFormula ou maxUses");
            if (h.optionPerPickOrFalse() && h.optionsOrEmpty().isEmpty()) p.add(where + ": optionPerPick sem options");
            if (!h.optionsOrEmpty().containsAll(h.repeatOptionsOrEmpty())) p.add(where + ": repeatOptions fora de options");
            if (h.category() == null) p.add(where + ": category deve ser um destes: " + Arrays.toString(HeritageCategory.values()));
            if (h.category() == HeritageCategory.ORIGIN && h.originsOrEmpty().isEmpty() && h.anyOfOrEmpty().isEmpty()) {
                p.add(where + ": Herança de Origem precisa de origins ou anyOf");
            }
            for (HeritageCondition cond : h.anyOfOrEmpty()) {
                cond.lineagesOrEmpty().stream().filter(l -> !lineages.contains(l.toLowerCase()))
                        .forEach(l -> p.add(where + ": anyOf cita linhagem desconhecida \"" + l + "\""));
                if (cond.heritage() != null && !ids.contains(cond.heritage().toLowerCase())) {
                    p.add(where + ": anyOf cita herança inexistente \"" + cond.heritage() + "\"");
                }
            }
            if (h.category() == HeritageCategory.REGION && h.regionsOrEmpty().isEmpty()) p.add(where + ": Herança de Região precisa de regions");
            h.regionsOrEmpty().stream().filter(r -> !regions.contains(r)).forEach(r -> p.add(where + ": região desconhecida \"" + r + "\""));
            h.lineagesOrEmpty().stream().filter(l -> !lineages.contains(l.toLowerCase()))
                    .forEach(l -> p.add(where + ": linhagem desconhecida \"" + l + "\""));
            h.classesOrEmpty().stream().filter(k -> !classes.contains(k)).forEach(k -> p.add(where + ": classe desconhecida \"" + k + "\""));
            h.excludesOrEmpty().stream().filter(x -> !ids.contains(x.toLowerCase())).forEach(x -> p.add(where + ": excludes cita herança inexistente \"" + x + "\""));
            h.requiresOrEmpty().stream().filter(x -> !ids.contains(x.toLowerCase())).forEach(x -> p.add(where + ": requires cita herança inexistente \"" + x + "\""));
            if (h.maxTimes() != null && h.maxTimes() < 1) p.add(where + ": maxTimes deve ser 1 ou mais");
            if (h.minAttributes() != null && h.minAttributes().values().stream().anyMatch(v -> v == null || v < 1)) {
                p.add(where + ": minAttributes precisa de valores (ex.: { \"STRENGTH\": 16 })");
            }
        }
    }

    private static void validateMethods(AttributeMethods m, List<String> p) {
        if (m.pointBuy() == null && m.standardArray() == null && m.manual() == null) {
            p.add("attributeMethods: ligue pelo menos um método (pointBuy, standardArray ou manual)");
        }
        AttributeMethods.PointBuy pb = m.pointBuy();
        if (pb != null) {
            if (pb.points() == null || pb.min() == null || pb.max() == null || pb.costs() == null || pb.min() > pb.max()) {
                p.add("pointBuy: precisa de points, min, max e costs");
            } else {
                for (int v = pb.min(); v <= pb.max(); v++) {
                    if (!pb.costs().containsKey(String.valueOf(v))) p.add("pointBuy: falta o custo do valor " + v);
                }
            }
        }
        if (m.standardArray() != null && m.standardArray().size() != Attribute.values().length) {
            p.add("standardArray: precisa de " + Attribute.values().length + " valores");
        }
        if (m.manual() != null && (m.manual().min() == null || m.manual().max() == null || m.manual().min() > m.manual().max())) {
            p.add("manual: precisa de min e max");
        }
    }

    private static void validateOptions(String what, List<RuleOption> list, List<String> p, Set<String> allowedIds, Set<String> crafts) {
        Set<String> ids = new HashSet<>();
        for (RuleOption o : list == null ? List.<RuleOption>of() : list) {
            String where = what + " " + o.id();
            if (blank(o.id())) p.add(what + ": item sem id");
            else if (!ids.add(o.id().toLowerCase())) p.add(where + ": id repetido");
            if (allowedIds != null && o.id() != null && !allowedIds.contains(o.id())) {
                p.add(where + ": id deve ser um destes: " + allowedIds);
            }
            if (blank(o.name())) p.add(where + ": falta name");
            if (o.details() != null && o.details().stream().anyMatch(d -> blank(d.name()) || blank(d.text()))) {
                p.add(where + ": cada item de details precisa de name e text");
            }
            if (o.languagesOrEmpty().stream().anyMatch(RuleCatalogService::blank)) p.add(where + ": idioma vazio em languages");
            validateGrants(where, o.grantsOrEmpty(), p, crafts);
            validateLevels(where, o.levelsOrEmpty(), p, crafts);
            Set<String> lineageIds = new HashSet<>();
            for (RuleLineage l : o.lineagesOrEmpty()) {
                String at = where + ", linhagem " + l.id();
                if (blank(l.id()) || blank(l.name())) p.add(where + ": cada linhagem precisa de id e name");
                else if (!lineageIds.add(l.id().toLowerCase())) p.add(at + ": id repetido");
                validateGrants(at, l.grantsOrEmpty(), p, crafts);
                validateLevels(at, l.levelsOrEmpty(), p, crafts);
            }
        }
    }

    private static void validateGrants(String where, List<Grant> grants, List<String> p, Set<String> crafts) {
        for (int i = 0; i < grants.size(); i++) {
            Grant g = grants.get(i);
            String at = where + ", concessão " + (i + 1);
            if (g.type() == null) {
                p.add(at + ": falta type");
                continue;
            }
            // when: fixa, ou escolha "_CHOICE" (feita se a opção já foi escolhida antes na mesma fonte); não em RESOURCE_CHOICE nem FEATURE com opções.
            if (g.when() != null && (!g.when().contains(":") || g.type() == GrantType.FEATURE && g.hasOptions() || g.type() == GrantType.RESOURCE_CHOICE)) {
                p.add(at + ": when é \"Habilidade:Opção\" e não vale em RESOURCE_CHOICE nem em FEATURE com opções");
            }
            if (g.valueByLevel() != null) {
                if (!Set.of(GrantType.ATTRIBUTE, GrantType.AC_BONUS, GrantType.SPEED, GrantType.SENSE).contains(g.type())) {
                    p.add(at + ": valueByLevel só vale em ATTRIBUTE, AC_BONUS, SPEED e SENSE");
                }
                g.valueByLevel().forEach((lv, n) -> {
                    if (!lv.matches("\\d+") || Integer.parseInt(lv) < 1 || Integer.parseInt(lv) > 20) p.add(at + ": valueByLevel usa o nível (1 a 20) como chave");
                    if (n == null) p.add(at + ": valueByLevel precisa de valores");
                });
            }
            switch (g.type()) {
                case ATTRIBUTE -> {
                    if (g.attribute() == null || g.amount() == null) p.add(at + " (ATTRIBUTE): precisa de attribute e amount");
                }
                case ATTRIBUTE_CHOICE -> {
                    if (g.count() == null || g.count() < 1 || g.amount() == null) p.add(at + " (ATTRIBUTE_CHOICE): precisa de count e amount");
                    checkOptions(at, g.options(), ATTRIBUTES, p);
                    // value: novo limite do atributo escolhido ("22": "até o máximo de 22"); sem value, 20.
                    if (g.value() != null && !g.value().matches("2[0-9]|30")) p.add(at + " (ATTRIBUTE_CHOICE): value é o limite do atributo (20 a 30)");
                }
                case SKILL -> {
                    if (g.skill() == null) p.add(at + " (SKILL): precisa de skill");
                }
                case SKILL_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (SKILL_CHOICE): precisa de count");
                    checkOptions(at, g.options(), SKILLS, p);
                }
                case EXPERTISE_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (EXPERTISE_CHOICE): precisa de count");
                    checkOptions(at, g.options(), SKILLS, p);
                }
                case SAVING_THROW_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (SAVING_THROW_CHOICE): precisa de count");
                    checkOptions(at, g.options(), ATTRIBUTES, p);
                }
                case ARMOR_PROFICIENCY -> {
                    if (g.value() == null || !ARMOR_TYPES.contains(g.value())) p.add(at + " (ARMOR_PROFICIENCY): value deve ser um destes: " + ARMOR_TYPES);
                }
                case WEAPON_PROFICIENCY -> {
                    if (blank(g.value())) p.add(at + " (WEAPON_PROFICIENCY): precisa de value (o nome da arma ou grupo)");
                }
                case SAVING_THROW -> {
                    if (g.attribute() == null) p.add(at + " (SAVING_THROW): precisa de attribute");
                }
                case FEATURE -> validateFeature(at, g, p);
                case PROFICIENCY_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (PROFICIENCY_CHOICE): precisa de count");
                    // Além dos tipos, opções literais: "ARMOR:LIGHT" (LIGHT/MEDIUM/HEAVY/SHIELD) e "WEAPON:<nome da arma>".
                    if (g.options() != null) g.options().stream()
                            .filter(o -> !Set.of("SKILL", "CRAFT", "MARTIAL_WEAPON").contains(o))
                            .filter(o -> !(o.startsWith("ARMOR:") && ARMOR_TYPES.contains(o.substring(6))))
                            .filter(o -> !(o.startsWith("WEAPON:") && o.length() > 7))
                            .forEach(o -> p.add(at + " (PROFICIENCY_CHOICE): opção desconhecida \"" + o + "\""));
                }
                case HP_BONUS -> {
                    boolean formula = g.usesFormula() != null && g.usesFormula() != UsesFormula.FIXED;
                    boolean halfDie = CreationService.HALF_HIT_DIE.equals(g.value());
                    if (g.amount() == null && !formula && !halfDie) p.add(at + " (HP_BONUS): precisa de amount, usesFormula ou value HALF_HIT_DIE");
                    if (g.value() != null && !halfDie) p.add(at + " (HP_BONUS): value só aceita HALF_HIT_DIE");
                }
                case SITUATIONAL -> {
                    // Alvo fixo (value) ou à escolha (options: os alvos possíveis).
                    String target = "(SKILL:[A-Z_]+|SAVE(:[A-Z]+)?|INITIATIVE|AC|ATTACK(:(MELEE|RANGED|BOW|CROSSBOW|THROWN|FIREARM))?)";
                    List<String> targets = g.hasOptions() ? g.options() : blank(g.value()) ? List.of() : List.of(g.value());
                    if (targets.isEmpty() || blank(g.description())) p.add(at + " (SITUATIONAL): precisa de value (alvo) ou options, e description");
                    else targets.stream().filter(t -> !t.matches(target)).forEach(t -> p.add(at + " (SITUATIONAL): alvo inválido " + t));
                }
                // Tipo de dano fixo (value) ou à escolha (options).
                case DAMAGE_BONUS -> {
                    if (blank(g.value()) || !g.value().matches("ATTACK(:(MELEE|RANGED|BOW|CROSSBOW|THROWN|FIREARM))?|UNARMED|TWO_HANDED|CHOSEN|WEAPON:.+")) {
                        p.add(at + " (DAMAGE_BONUS): alvo inválido " + g.value());
                    }
                    if (g.amount() == null && g.damage() == null && g.usesFormula() == null) p.add(at + " (DAMAGE_BONUS): precisa de amount, damage ou usesFormula");
                }
                case SENSE -> {
                    java.util.Set<String> kinds = java.util.Set.of("DARKVISION", "BLINDSIGHT", "TREMORSENSE", "TELEPATHY");
                    List<String> types = g.hasOptions() ? g.options() : g.value() == null ? List.of() : List.of(g.value());
                    if (types.isEmpty() || types.stream().anyMatch(t -> !kinds.contains(t))) p.add(at + " (SENSE): value/options deve ser " + kinds);
                    if (g.feet() == null && (g.valueByLevel() == null || g.valueByLevel().isEmpty())) p.add(at + " (SENSE): precisa de feet ou valueByLevel");
                }
                case EXTRA_USES -> {
                    if (blank(g.value())) p.add(at + " (EXTRA_USES): falta value (nome da habilidade)");
                    if (g.amount() == null && (g.usesFormula() == null || g.usesFormula() == UsesFormula.FIXED)) p.add(at + " (EXTRA_USES): precisa de amount ou usesFormula");
                }
                case DAMAGE_REDUCTION -> {
                    if (blank(g.value())) p.add(at + " (DAMAGE_REDUCTION): falta value (tipo de dano)");
                    if (g.amount() == null && g.usesFormula() != UsesFormula.PROFICIENCY && g.usesFormula() != UsesFormula.HALF_PROFICIENCY) p.add(at + " (DAMAGE_REDUCTION): precisa de amount ou usesFormula PROFICIENCY/HALF_PROFICIENCY");
                }
                case CONDITION_IMMUNITY -> {
                    if (blank(g.value())) p.add(at + " (CONDITION_IMMUNITY): falta value (a condição)");
                }
                case RESISTANCE, VULNERABILITY, ABSORPTION, IMMUNITY -> {
                    if (blank(g.value()) && !g.hasOptions()) p.add(at + " (" + g.type() + "): falta value ou options (tipo de dano)");
                }
                case PASSIVE_BONUS -> {
                    if (!"PERCEPTION".equals(g.value()) && !"INSIGHT".equals(g.value())) p.add(at + " (PASSIVE_BONUS): value é PERCEPTION ou INSIGHT");
                    if (g.amount() == null && g.usesFormula() != UsesFormula.HALF_PROFICIENCY) p.add(at + " (PASSIVE_BONUS): precisa de amount ou usesFormula HALF_PROFICIENCY");
                }
                case INITIATIVE -> {
                    if (g.amount() == null) p.add(at + " (INITIATIVE): precisa de amount");
                }
                case GOLD -> {
                    if (g.amount() == null) p.add(at + " (GOLD): precisa de amount");
                }
                case HERITAGE_POINTS -> {
                    if (g.amount() == null) p.add(at + " (HERITAGE_POINTS): precisa de amount");
                    if (g.value() != null && !HERITAGE_SCOPES.contains(g.value())) p.add(at + " (HERITAGE_POINTS): value deve ser REGION, ORIGIN, GENERAL ou ANY");
                }
                case ABILITY_USES -> {
                    if (blank(g.value())) p.add(at + " (ABILITY_USES): falta value (nome da habilidade)");
                    if (g.amount() == null && g.usesFormula() == null && g.maxUses() == null) p.add(at + " (ABILITY_USES): precisa de amount, usesFormula ou maxUses");
                }
                case SPEED -> {
                    if (g.walkFraction() != null && (g.value() == null || g.value().equals("WALK") || g.value().equals("ALL"))) {
                        p.add(at + " (SPEED): walkFraction só vale para SWIM, CLIMB, FLY ou BURROW");
                    }
                    if (g.feet() == null && g.walkFraction() == null) p.add(at + " (SPEED): precisa de feet ou walkFraction");
                    if (g.value() != null && !SPEED_TYPES.contains(g.value())) p.add(at + " (SPEED): value deve ser um destes: " + SPEED_TYPES);
                    if (g.usesFormula() != null && g.usesFormula() != UsesFormula.PROFICIENCY) p.add(at + " (SPEED): usesFormula só aceita PROFICIENCY");
                    if (g.amount() != null && (g.value() == null || g.value().equals("WALK") || g.value().equals("ALL"))) {
                        p.add(at + " (SPEED): amount (aumento se já tiver) só vale para SWIM, CLIMB, FLY ou BURROW");
                    }
                }
                case ARMOR_CLASS -> {
                    if (blank(g.name()) && blank(g.label())) p.add(at + " (ARMOR_CLASS): precisa de name");
                    if (g.armor() == null || g.armor().base() == null) p.add(at + " (ARMOR_CLASS): precisa de armor com base");
                    if (g.armor() != null && g.armor().requiresArmor() != null && !ARMOR_TYPES.contains(g.armor().requiresArmor())) {
                        p.add(at + " (ARMOR_CLASS): requiresArmor deve ser um destes: " + ARMOR_TYPES);
                    }
                    checkOptions(at, g.options(), ATTRIBUTES, p);
                    if (g.armor() != null && (g.armor().feature() == null) != (g.armor().featureOption() == null)) {
                        p.add(at + " (ARMOR_CLASS): feature e featureOption andam juntos");
                    }
                }
                case AC_BONUS -> {
                    if (blank(g.name()) && blank(g.label())) p.add(at + " (AC_BONUS): precisa de name");
                    boolean scales = g.usesFormula() == UsesFormula.PROFICIENCY || (g.armor() != null && Boolean.TRUE.equals(g.armor().proficiency()));
                    if (g.amount() == null && !scales) p.add(at + " (AC_BONUS): precisa de amount ou usesFormula PROFICIENCY");
                }
                case SIZE -> {
                    if (g.value() == null || !SIZES.contains(g.value()) && !"UP".equals(g.value())) p.add(at + " (SIZE): value deve ser um destes: " + SIZES + " ou UP");
                }
                case SIZE_CHOICE -> {
                    if (g.options() == null || g.options().isEmpty()) p.add(at + " (SIZE_CHOICE): precisa de options");
                    checkOptions(at, g.options(), SIZES, p);
                }
                case CRAFT -> {
                    if (g.value() == null || !crafts.contains(g.value())) p.add(at + " (CRAFT): value deve ser o id de um ofício de crafts");
                }
                case CRAFT_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (CRAFT_CHOICE): precisa de count");
                    checkOptions(at, g.options(), crafts, p);
                }
                case LANGUAGE -> {
                    if (blank(g.value())) p.add(at + " (LANGUAGE): precisa de value (o nome do idioma)");
                }
                case LANGUAGE_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (LANGUAGE_CHOICE): precisa de count");
                }
                case RESOURCE_CHOICE -> {
                    if (g.value() == null || !RESOURCE_KINDS.contains(g.value())) p.add(at + " (RESOURCE_CHOICE): value deve ser um destes: " + RESOURCE_KINDS);
                    if ("VEL".equals(g.value())) {
                        if (g.amount() == null || g.amount() < 1) p.add(at + " (RESOURCE_CHOICE): Vel precisa de amount (pontos ◆)");
                    } else if (g.count() != null && g.count() < 1) {
                        p.add(at + " (RESOURCE_CHOICE): count deve ser 1 ou mais");
                    }
                }
                // Mistérios e magias citados são conferidos em validateSpellGrants (precisa do catálogo de magia).
                case MYSTERY, SPELL -> {
                    if (blank(g.value()) && !(g.type() == GrantType.MYSTERY && g.hasOptions())) p.add(at + " (" + g.type() + "): falta value");
                }
                case SPELL_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (SPELL_CHOICE): precisa de count");
                    if (g.spellLevel() == null || g.spellLevel() < 0 || g.spellLevel() > 9) p.add(at + " (SPELL_CHOICE): spellLevel deve ir de 0 a 9");
                    if (g.value() != null && g.value().startsWith("LIST:")) {
                        for (String k : g.value().substring(5).replace("+ATTACK", "").replace("+RITUAL", "").split(",")) {
                            if (Arrays.stream(CharacterClassType.values()).noneMatch(t -> t.name().equals(k))) p.add(at + " (SPELL_CHOICE): classe desconhecida em LIST: " + k);
                        }
                    } else if (g.value() != null && !SPELL_SOURCES.contains(g.value()) && !"ANY".equals(g.value()) && !g.value().startsWith("MYSTERY:")) {
                        p.add(at + " (SPELL_CHOICE): value deve ser um destes: " + SPELL_SOURCES + ", ANY, MYSTERY:<ids> ou LIST:<classes>");
                    }
                }
                // Os itens citados são conferidos em validateEquipment (precisa do catálogo de itens).
                case EQUIPMENT -> {
                    if (blank(g.value())) p.add(at + " (EQUIPMENT): falta value (os itens)");
                }
                case EQUIPMENT_CHOICE -> {
                    if (g.options() == null || g.options().isEmpty()) p.add(at + " (EQUIPMENT_CHOICE): falta options");
                    if (g.count() != null && g.count() < 1) p.add(at + " (EQUIPMENT_CHOICE): count deve ser 1 ou mais");
                }
            }
        }
    }

    private static final Set<UsesFormula> NEEDS_ATTRIBUTE = Set.of(UsesFormula.ATTRIBUTE_MODIFIER, UsesFormula.HALF_ATTRIBUTE_MODIFIER,
            UsesFormula.LEVEL_PLUS_ATTRIBUTE, UsesFormula.PROFICIENCY_PLUS_ATTRIBUTE, UsesFormula.TWO_ATTRIBUTES);

    private static void validateFeature(String at, Grant g, List<String> p) {
        if (blank(g.name())) p.add(at + " (FEATURE): precisa de name");
        if (g.options() != null && g.options().stream().anyMatch(RuleCatalogService::blank)) p.add(at + " (FEATURE): opção vazia em options");
        if (g.damage() != null && !DICE.matcher(g.damage().replace(" ", "")).matches()) {
            p.add(at + " (FEATURE): damage deve ser como 2d6 ou 2d6+4");
        }
        if (g.maxUses() != null && g.maxUses() < 1) p.add(at + " (FEATURE): maxUses deve ser maior que 0");
        if (g.usesFormula() != null && NEEDS_ATTRIBUTE.contains(g.usesFormula()) && g.attribute() == null) {
            p.add(at + " (FEATURE): usesFormula " + g.usesFormula() + " precisa de attribute");
        }
        if (g.usesFormula() == UsesFormula.TWO_ATTRIBUTES && (g.value() == null || !ATTRIBUTES.contains(g.value()))) {
            p.add(at + " (FEATURE): usesFormula TWO_ATTRIBUTES precisa do segundo atributo em value");
        }
        if (g.optionTexts() != null) g.optionTexts().keySet().stream().filter(o -> !g.hasOptions() || !g.options().contains(o))
                .forEach(o -> p.add(at + " (FEATURE): optionTexts cita opção inexistente \"" + o + "\""));
        if (g.optionUses() != null) {
            g.optionUses().forEach((option, u) -> {
                if (!g.hasOptions() || !g.options().contains(option)) p.add(at + " (FEATURE): optionUses cita opção inexistente \"" + option + "\"");
                if (u.usesFormula() == null && u.maxUses() == null) p.add(at + " (FEATURE): optionUses \"" + option + "\" precisa de usesFormula ou maxUses");
                if ((u.usesFormula() == UsesFormula.ATTRIBUTE_MODIFIER || u.usesFormula() == UsesFormula.HALF_ATTRIBUTE_MODIFIER)
                        && u.attribute() == null && g.attribute() == null) {
                    p.add(at + " (FEATURE): optionUses \"" + option + "\" precisa de attribute");
                }
            });
        }
        if (g.usesByLevel() != null) {
            g.usesByLevel().forEach((lv, n) -> {
                if (!lv.matches("\\d+") || Integer.parseInt(lv) < 1 || Integer.parseInt(lv) > 20) p.add(at + " (FEATURE): usesByLevel usa o nível (1 a 20) como chave");
                // null = sem limite a partir desse nível.
                if (n != null && n < 0) p.add(at + " (FEATURE): usesByLevel precisa de valores 0 ou mais (ou null para sem limite)");
            });
        }
        if (g.diceByLevel() != null) {
            g.diceByLevel().forEach((lv, dice) -> {
                if (!lv.matches("\\d+") || Integer.parseInt(lv) < 1 || Integer.parseInt(lv) > 20) p.add(at + " (FEATURE): diceByLevel usa o nível (1 a 20) como chave");
                if (dice == null || !DICE.matcher(dice.replace(" ", "")).matches()) p.add(at + " (FEATURE): dado inválido em diceByLevel: " + dice);
            });
        }
        if (g.usesPlus() != null && (g.usesFormula() == null || g.usesFormula() == UsesFormula.FIXED)) {
            p.add(at + " (FEATURE): usesPlus só vale com usesFormula (ex.: PROFICIENCY + 3)");
        }
        if (g.usesFormula() != null && g.usesFormula() != UsesFormula.FIXED && g.maxUses() != null) {
            p.add(at + " (FEATURE): use maxUses ou usesFormula, não os dois");
        }
        if (g.damageBonus() != null) {
            if (g.damage() == null && g.diceByProficiency() == null && g.diceByLevel() == null) {
                p.add(at + " (FEATURE): damageBonus precisa de damage, diceByProficiency ou diceByLevel");
            }
            g.damageBonus().stream()
                    .filter(t -> !Set.of("PROFICIENCY", "HALF_PROFICIENCY", "STRENGTH_OR_DEXTERITY").contains(t) && !ATTRIBUTES.contains(t))
                    .forEach(t -> p.add(at + " (FEATURE): damageBonus desconhecido \"" + t + "\""));
        }
        Map<String, String> table = g.diceByProficiency();
        if (table != null) {
            table.forEach((pb, dice) -> {
                if (!pb.matches("\\d+")) p.add(at + " (FEATURE): diceByProficiency usa o bônus como chave (ex.: \"2\")");
                if (dice == null || !DICE.matcher(dice.replace(" ", "")).matches()) {
                    p.add(at + " (FEATURE): dado inválido em diceByProficiency: " + dice);
                }
            });
        }
    }

    private static void checkOptions(String at, List<String> options, Set<String> allowed, List<String> p) {
        if (options == null) return;
        for (String o : options) {
            if (!allowed.contains(o)) p.add(at + ": opção desconhecida \"" + o + "\"");
        }
    }

    // Opções citadas pelos campos por opção da Herança (opção → nome do campo).
    private static Map<String, String> optionKeys(RuleHeritage h) {
        Map<String, String> keys = new java.util.LinkedHashMap<>();
        if (h.optionTexts() != null) h.optionTexts().keySet().forEach(o -> keys.put(o, "optionTexts"));
        if (h.optionUses() != null) h.optionUses().keySet().forEach(o -> keys.put(o, "optionUses"));
        if (h.optionExecution() != null) h.optionExecution().keySet().forEach(o -> keys.put(o, "optionExecution"));
        return keys;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static Set<String> names(Enum<?>[] values) {
        Set<String> set = new HashSet<>();
        for (Enum<?> v : values) set.add(v.name());
        return set;
    }
}
