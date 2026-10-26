package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.enums.UsesFormula;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleLineage;
import gusleite.runarcana_nexus.rules.RuleLevel;
import gusleite.runarcana_nexus.rules.RuleOption;
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
    // Tipo de deslocamento da concessão SPEED (sem value = WALK; ALL = todos os deslocamentos que o personagem tiver).
    static final Set<String> SPEED_TYPES = Set.of("WALK", "SWIM", "CLIMB", "FLY", "BURROW", "ALL");
    private static final Set<String> CRAFT_KINDS = Set.of("MAJOR", "MINOR");

    private final RuleCatalog catalog;

    public RuleCatalogService(ResourceLoader resources,
                              @Value("${runarcana.rules.catalog:classpath:rules/criacao.json}") String location,
                              @Value("${runarcana.rules.heritages:classpath:rules/herancas.json}") String heritagesLocation,
                              @Value("${runarcana.rules.traits:classpath:rules/tracos.json}") String traitsLocation) {
        RuleCatalog base = load(resources.getResource(location), location, RuleCatalog.class);
        HeritageFile heritages = load(resources.getResource(heritagesLocation), heritagesLocation, HeritageFile.class);
        RuleTraits traits = load(resources.getResource(traitsLocation), traitsLocation, RuleTraits.class);
        this.catalog = base.withHeritages(heritages.heritages()).withTraits(traits);
        List<String> problems = validate(catalog);
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Regras de criação inválidas em " + location + " / " + heritagesLocation
                    + " / " + traitsLocation + ":\n - " + String.join("\n - ", problems));
        }
    }

    // Formato do rules/herancas.json: { "heritages": [ ... ] }.
    record HeritageFile(List<RuleHeritage> heritages) {}

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

    private static <T> T load(Resource resource, String location, Class<T> type) {
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
        return p;
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
            if (h.category() == null) p.add(where + ": category deve ser um destes: " + Arrays.toString(HeritageCategory.values()));
            if (h.category() == HeritageCategory.ORIGIN && h.originsOrEmpty().isEmpty()) p.add(where + ": Herança de Origem precisa de origins");
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
            switch (g.type()) {
                case ATTRIBUTE -> {
                    if (g.attribute() == null || g.amount() == null) p.add(at + " (ATTRIBUTE): precisa de attribute e amount");
                }
                case ATTRIBUTE_CHOICE -> {
                    if (g.count() == null || g.count() < 1 || g.amount() == null) p.add(at + " (ATTRIBUTE_CHOICE): precisa de count e amount");
                    checkOptions(at, g.options(), ATTRIBUTES, p);
                }
                case SKILL -> {
                    if (g.skill() == null) p.add(at + " (SKILL): precisa de skill");
                }
                case SKILL_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (SKILL_CHOICE): precisa de count");
                    checkOptions(at, g.options(), SKILLS, p);
                }
                case SAVING_THROW -> {
                    if (g.attribute() == null) p.add(at + " (SAVING_THROW): precisa de attribute");
                }
                case FEATURE -> validateFeature(at, g, p);
                case PROFICIENCY_CHOICE -> {
                    if (g.count() == null || g.count() < 1) p.add(at + " (PROFICIENCY_CHOICE): precisa de count");
                    checkOptions(at, g.options(), Set.of("SKILL", "CRAFT", "MARTIAL_WEAPON"), p);
                }
                case HP_BONUS -> {
                    boolean formula = g.usesFormula() != null && g.usesFormula() != UsesFormula.FIXED;
                    if (g.amount() == null && !formula) p.add(at + " (HP_BONUS): precisa de amount ou usesFormula");
                }
                case GOLD -> {
                    if (g.amount() == null) p.add(at + " (GOLD): precisa de amount");
                }
                case HERITAGE_POINTS -> {
                    if (g.amount() == null) p.add(at + " (HERITAGE_POINTS): precisa de amount");
                    if (g.value() != null && !HERITAGE_SCOPES.contains(g.value())) p.add(at + " (HERITAGE_POINTS): value deve ser REGION, ORIGIN, GENERAL ou ANY");
                }
                case SPEED -> {
                    if (g.feet() == null) p.add(at + " (SPEED): precisa de feet");
                    if (g.value() != null && !SPEED_TYPES.contains(g.value())) p.add(at + " (SPEED): value deve ser um destes: " + SPEED_TYPES);
                }
                case ARMOR_CLASS -> {
                    if (blank(g.name()) && blank(g.label())) p.add(at + " (ARMOR_CLASS): precisa de name");
                    if (g.armor() == null || g.armor().base() == null) p.add(at + " (ARMOR_CLASS): precisa de armor com base");
                    checkOptions(at, g.options(), ATTRIBUTES, p);
                }
                case AC_BONUS -> {
                    if (blank(g.name()) && blank(g.label())) p.add(at + " (AC_BONUS): precisa de name");
                    boolean scales = g.usesFormula() == UsesFormula.PROFICIENCY || (g.armor() != null && Boolean.TRUE.equals(g.armor().proficiency()));
                    if (g.amount() == null && !scales) p.add(at + " (AC_BONUS): precisa de amount ou usesFormula PROFICIENCY");
                }
                case SIZE -> {
                    if (g.value() == null || !SIZES.contains(g.value())) p.add(at + " (SIZE): value deve ser um destes: " + SIZES);
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
            }
        }
    }

    private static void validateFeature(String at, Grant g, List<String> p) {
        if (blank(g.name())) p.add(at + " (FEATURE): precisa de name");
        if (g.options() != null && g.options().stream().anyMatch(RuleCatalogService::blank)) p.add(at + " (FEATURE): opção vazia em options");
        if (g.damage() != null && !DICE.matcher(g.damage().replace(" ", "")).matches()) {
            p.add(at + " (FEATURE): damage deve ser como 2d6 ou 2d6+4");
        }
        if (g.maxUses() != null && g.maxUses() < 1) p.add(at + " (FEATURE): maxUses deve ser maior que 0");
        if (g.usesFormula() == UsesFormula.ATTRIBUTE_MODIFIER && g.attribute() == null) {
            p.add(at + " (FEATURE): usesFormula ATTRIBUTE_MODIFIER precisa de attribute");
        }
        if (g.usesFormula() != null && g.usesFormula() != UsesFormula.FIXED && g.maxUses() != null) {
            p.add(at + " (FEATURE): use maxUses ou usesFormula, não os dois");
        }
        if (g.damageBonus() != null) {
            if (g.damage() == null && g.diceByProficiency() == null) p.add(at + " (FEATURE): damageBonus precisa de damage ou diceByProficiency");
            g.damageBonus().stream()
                    .filter(t -> !Set.of("PROFICIENCY", "HALF_PROFICIENCY").contains(t) && !ATTRIBUTES.contains(t))
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

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static Set<String> names(Enum<?>[] values) {
        Set<String> set = new HashSet<>();
        for (Enum<?> v : values) set.add(v.name());
        return set;
    }
}
