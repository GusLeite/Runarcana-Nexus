package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.enums.UsesFormula;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import gusleite.runarcana_nexus.model.player.CharacterSkill;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CreationPreview;
import gusleite.runarcana_nexus.record.CreationPreview.AttributeLine;
import gusleite.runarcana_nexus.record.CreationPreview.ChoiceLine;
import gusleite.runarcana_nexus.record.CreationPreview.FeatureLine;
import gusleite.runarcana_nexus.record.CreationPreview.HeritageLine;
import gusleite.runarcana_nexus.record.CreationPreview.HeritagePool;
import gusleite.runarcana_nexus.record.CreationPreview.HeritageStatus;
import gusleite.runarcana_nexus.record.CreationPreview.PointBuyStatus;
import gusleite.runarcana_nexus.record.CreationPreview.SaveLine;
import gusleite.runarcana_nexus.record.CreationPreview.SkillLine;
import gusleite.runarcana_nexus.record.CreationRequest;
import gusleite.runarcana_nexus.record.CreationRequest.HeritagePick;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterAbilityRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleLineage;
import gusleite.runarcana_nexus.rules.RuleOption;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Criação de personagem pelo assistente. evaluate() aplica as concessões do catálogo às escolhas
// e é usado tanto na prévia (ficha em construção) quanto na criação, para as duas nunca divergirem.
@Service
public class CreationService {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    // Bônus de proficiência no 1º nível (a ficha nasce no nível 1).
    private static final int LEVEL_ONE_PROFICIENCY = 2;
    private static final double DEFAULT_SPEED_FEET = 30;
    private static final Pattern DICE_WITH_BONUS = Pattern.compile("^(\\d+d\\d+)([+-]\\d+)?$");

    private final RuleCatalogService rules;
    private final CharacterService characterService;
    private final CharacterRepository characters;
    private final CharacterClassRepository classes;
    private final BackGroundRepository backgrounds;
    private final CharacterAbilityRepository abilities;

    public CreationService(RuleCatalogService rules, CharacterService characterService, CharacterRepository characters,
                           CharacterClassRepository classes, BackGroundRepository backgrounds,
                           CharacterAbilityRepository abilities) {
        this.rules = rules;
        this.characterService = characterService;
        this.characters = characters;
        this.classes = classes;
        this.backgrounds = backgrounds;
        this.abilities = abilities;
    }

    public CreationPreview preview(CreationRequest request) {
        return evaluate(request).toPreview();
    }

    @Transactional
    public CharacterResponse create(Account account, CreationRequest request) {
        if (account.isMaster()) {
            throw ApiException.forbidden("O mestre não tem ficha própria.");
        }
        if (characterService.findCharacterOf(account).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Você já tem uma ficha.");
        }
        Build b = evaluate(request);
        if (!b.errors.isEmpty()) {
            throw ApiException.badRequest(b.errors.getFirst());
        }

        CharacterClassType type = CharacterClassType.valueOf(b.klass.id());
        CharacterClass characterClass = classes.findByClassName(type).orElseGet(CharacterClass::new);
        characterClass.setClassName(type);
        characterClass.setHitHpDice(b.klass.hitDie());
        classes.save(characterClass);

        Character c = new Character();
        c.setAccount(account);
        c.setCharacterName(request.characterName().trim());
        c.setPlayerName(blank(request.playerName()) ? account.getUsername() : request.playerName().trim());
        c.setLevel(1);
        c.setAge(request.age());
        c.setHeight(request.height());
        c.setAlignment(request.alignment());
        c.setRegion(b.region == null ? null : Region.valueOf(b.region.id()));
        c.setCharacterClass(characterClass);
        c.setBackground(b.background == null ? null : backgroundEntity(b.background));
        c.setOrigin(b.origin.name());
        c.setLineage(b.lineage == null ? null : b.lineage.name());
        c.setStr(b.total(Attribute.STRENGTH));
        c.setDex(b.total(Attribute.DEXTERITY));
        c.setCon(b.total(Attribute.CONSTITUTION));
        c.setIntel(b.total(Attribute.INTELLIGENCE));
        c.setWis(b.total(Attribute.WISDOM));
        c.setCha(b.total(Attribute.CHARISMA));
        c.setMaxHp(b.maxHp());
        c.setCurrentHp(b.maxHp());
        c.setSpeed(b.speed());
        c.setSize(b.size);
        c.getLanguages().addAll(b.languages);
        // A ficha guarda o nome do ofício (não o id do catálogo), para mostrar sem depender do catálogo.
        Map<String, String> craftNames = new LinkedHashMap<>();
        rules.catalog().craftsOrEmpty().forEach(k -> craftNames.put(k.id(), k.name()));
        b.crafts.forEach(id -> c.getCrafts().add(craftNames.getOrDefault(id, id)));
        // Os pontos da criação são gastos no assistente; a ficha guarda o que sobrou (normalmente 0).
        c.setHeritagePoints(b.heritagePoints - b.heritagesSpent());
        b.heritages.forEach(h -> c.getHeritages().add(displayName(h)));
        c.setGold(b.gold);
        c.setInspiration(0);
        c.getSavingThrows().addAll(b.saves.keySet());
        c.setBuild(JSON.writeValueAsString(request));
        for (SkillType skill : b.skills.keySet()) {
            CharacterSkill s = new CharacterSkill();
            s.setCharacter(c);
            s.setSkillType(skill);
            s.setProficient(true);
            c.getSkills().add(s);
        }
        characters.save(c);

        for (Sourced<Grant> f : b.features) {
            abilities.save(abilityFrom(c, f.value(), LEVEL_ONE_PROFICIENCY));
        }
        return CharacterResponse.of(c);
    }

    // ---------- cálculo ----------

    private Build evaluate(CreationRequest r) {
        RuleCatalog catalog = rules.catalog();
        Build b = new Build();
        b.roundUp = rules.roundsUp();
        Map<String, List<String>> picks = r.choices() == null ? Map.of() : r.choices();

        b.origin = pick(r.originId(), rules::origin, "Escolha uma origem.", "Origem desconhecida.", b.errors);
        if (b.origin != null && !b.origin.lineagesOrEmpty().isEmpty()) {
            List<RuleLineage> lineages = b.origin.lineagesOrEmpty();
            b.lineage = pick(r.lineageId(), id -> lineages.stream().filter(l -> l.id().equalsIgnoreCase(id)).findFirst(),
                    "Escolha a linhagem.", "Linhagem desconhecida.", b.errors);
        }
        if (catalog.regions() != null && !catalog.regions().isEmpty()) {
            b.region = pick(r.regionId(), rules::region, "Escolha uma região.", "Região desconhecida.", b.errors);
        }
        b.klass = pick(r.classId(), rules::characterClass, "Escolha uma classe.", "Classe desconhecida.", b.errors);
        if (catalog.backgrounds() != null && !catalog.backgrounds().isEmpty()) {
            b.background = pick(r.backgroundId(), rules::background, "Escolha um passado.", "Passado desconhecido.", b.errors);
        }

        // Fontes na ordem do assistente; a chave de cada escolha nasce daqui.
        List<Source> sources = new ArrayList<>();
        if (b.origin != null) sources.add(new Source("origin:" + b.origin.id(), "Origem: " + b.origin.name(), b.origin.grantsOrEmpty()));
        if (b.lineage != null) sources.add(new Source("lineage:" + b.lineage.id(), "Linhagem: " + b.lineage.name(), b.lineage.grantsOrEmpty()));
        if (b.region != null) sources.add(new Source("region:" + b.region.id(), "Região: " + b.region.name(), b.region.grantsOrEmpty()));
        if (b.klass != null) sources.add(new Source("class:" + b.klass.id(), "Classe: " + b.klass.name(), b.klass.grantsOrEmpty()));
        if (b.background != null) sources.add(new Source("background:" + b.background.id(), "Passado: " + b.background.name(), b.background.grantsOrEmpty()));

        baseAttributes(r, catalog.attributeMethods(), b);

        // 1ª passada: o que é fixo. 2ª: as escolhas (que não podem repetir algo já ganho).
        for (Source s : sources) {
            for (Grant g : s.grants()) {
                switch (g.type()) {
                    case ATTRIBUTE -> b.bonus.merge(g.attribute(), g.amount(), Integer::sum);
                    case SKILL -> b.skills.putIfAbsent(g.skill(), s.label());
                    case SAVING_THROW -> b.saves.putIfAbsent(g.attribute(), s.label());
                    case FEATURE -> {
                        if (!g.hasOptions()) b.features.add(new Sourced<>(g, s.label()));
                    }
                    case HP_BONUS -> b.hpBonus += hpBonusFor(g, LEVEL_ONE_PROFICIENCY, b.roundUp);
                    case SPEED -> b.speedBonus += g.feet();
                    case GOLD -> b.gold += g.amount();
                    case SIZE -> b.size = CreatureSize.valueOf(g.value());
                    case CRAFT -> b.crafts.add(g.value());
                    case LANGUAGE -> b.languages.add(g.value());
                    case HERITAGE_POINTS -> {
                        b.heritagePoints += g.amount();
                        b.pools.merge(g.value() == null ? "ANY" : g.value(), g.amount(), Integer::sum);
                    }
                    default -> { }
                }
            }
        }
        List<String> allCrafts = catalog.craftsOrEmpty().stream().map(RuleCatalog.Craft::id).toList();
        for (Source s : sources) {
            List<Grant> grants = s.grants();
            // "+2 em um atributo e +1 em outro": escolhas de atributo da mesma fonte não repetem atributo.
            Set<String> sourceAttributes = new LinkedHashSet<>();
            for (int i = 0; i < grants.size(); i++) {
                Grant g = grants.get(i);
                String key = s.key() + ":" + i;
                List<String> picked = picks.get(key);
                switch (g.type()) {
                    case ATTRIBUTE_CHOICE -> {
                        List<String> options = orAll(g.options(), Attribute.values()).stream()
                                .filter(o -> !sourceAttributes.contains(o)).toList();
                        String label = orLabel(g, "Escolha " + g.count() + " atributo(s) para +" + g.amount());
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        selected.forEach(a -> b.bonus.merge(Attribute.valueOf(a), g.amount(), Integer::sum));
                        sourceAttributes.addAll(selected);
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case SKILL_CHOICE -> {
                        List<String> options = orAll(g.options(), SkillType.values()).stream()
                                .filter(o -> !b.skills.containsKey(SkillType.valueOf(o))).toList();
                        String label = orLabel(g, "Escolha " + g.count() + " perícia(s)");
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        selected.forEach(o -> b.skills.put(SkillType.valueOf(o), s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case FEATURE -> {
                        if (!g.hasOptions()) break;
                        String label = orLabel(g, g.name() + ": escolha uma opção");
                        List<String> selected = choose(picked, g.options(), 1, label, b.errors);
                        String name = selected.isEmpty() ? g.name() : g.name() + " (" + selected.getFirst() + ")";
                        b.features.add(new Sourced<>(g.withName(name), s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, 1, g.options(), selected, s.label(), null));
                    }
                    case PROFICIENCY_CHOICE -> {
                        List<String> kinds = g.hasOptions() ? g.options() : List.of("SKILL", "CRAFT", "MARTIAL_WEAPON");
                        List<String> options = new ArrayList<>();
                        if (kinds.contains("SKILL")) {
                            Arrays.stream(SkillType.values()).filter(k -> !b.skills.containsKey(k)).forEach(k -> options.add("SKILL:" + k.name()));
                        }
                        if (kinds.contains("CRAFT")) {
                            allCrafts.stream().filter(k -> !b.crafts.contains(k)).forEach(k -> options.add("CRAFT:" + k));
                        }
                        if (kinds.contains("MARTIAL_WEAPON")) options.add("MARTIAL_WEAPON");
                        String label = orLabel(g, "Escolha " + g.count() + " proficiência(s)");
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        for (String o : selected) {
                            if (o.startsWith("SKILL:")) b.skills.put(SkillType.valueOf(o.substring(6)), s.label());
                            else if (o.startsWith("CRAFT:")) b.crafts.add(o.substring(6));
                            else b.features.add(new Sourced<>(Grant.feature(AbilityType.PASSIVE, "Proficiência em arma marcial",
                                    "Proficiência em uma arma marcial à escolha (combine qual com o mestre)."), s.label()));
                        }
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case SIZE_CHOICE -> {
                        String label = orLabel(g, "Escolha o tamanho");
                        List<String> selected = choose(picked, g.options(), 1, label, b.errors);
                        if (!selected.isEmpty()) b.size = CreatureSize.valueOf(selected.getFirst());
                        b.choices.add(new ChoiceLine(key, g.type(), label, 1, g.options(), selected, s.label(), null));
                    }
                    case CRAFT_CHOICE -> {
                        List<String> options = (g.options() == null || g.options().isEmpty() ? allCrafts : g.options()).stream()
                                .filter(o -> !b.crafts.contains(o)).toList();
                        String label = orLabel(g, "Escolha " + g.count() + " ofício(s)");
                        b.choices.add(optionalChoice(key, g, label, options, picked, s.label(), b,
                                "A lista de ofícios ainda não foi cadastrada nas regras.", b.crafts::add));
                    }
                    case LANGUAGE_CHOICE -> {
                        List<String> source = g.options() != null && !g.options().isEmpty() ? g.options()
                                : Boolean.TRUE.equals(g.fromRegion()) && b.region != null ? b.region.languagesOrEmpty()
                                : List.of();
                        List<String> options = source.stream().filter(o -> !b.languages.contains(o)).toList();
                        String label = orLabel(g, Boolean.TRUE.equals(g.fromRegion())
                                ? "Escolha " + g.count() + " idioma(s) da região" : "Escolha " + g.count() + " idioma(s)");
                        String note = Boolean.TRUE.equals(g.fromRegion()) && b.region == null
                                ? "Escolha a região para ver os idiomas."
                                : "Os idiomas desta região ainda não foram cadastrados nas regras.";
                        b.choices.add(optionalChoice(key, g, label, options, picked, s.label(), b, note, b.languages::add));
                    }
                    default -> { }
                }
            }
        }

        heritages(r, b);

        if (b.origin != null) b.baseSpeed = b.origin.speed() != null ? b.origin.speed()
                : catalog.baseSpeed() != null ? catalog.baseSpeed() : DEFAULT_SPEED_FEET;
        if (b.klass != null && b.klass.startingGold() != null) b.gold += b.klass.startingGold();
        if (b.background != null && b.background.startingGold() != null) b.gold += b.background.startingGold();
        if (b.origin != null && b.origin.startingGold() != null) b.gold += b.origin.startingGold();

        if (blank(r.characterName())) b.errors.add("Dê um nome ao personagem.");
        if (r.age() == null || r.age() < 1) b.errors.add("Informe a idade (1 ou mais).");
        if (r.height() == null || r.height() <= 0) b.errors.add("Informe a altura em metros.");
        return b;
    }

    // ---------- Heranças ----------

    // Compra das Heranças com os pontos de Herança. Cada escolha custa 1 ponto do tipo certo:
    // ponto de Região compra Heranças de Região e Gerais; de Origem, de Origem e Gerais; ANY, qualquer uma.
    private void heritages(CreationRequest r, Build b) {
        Map<String, Integer> times = new LinkedHashMap<>();
        Map<String, String> options = new LinkedHashMap<>();
        Map<String, RuleHeritage> byId = new LinkedHashMap<>();
        for (HeritagePick pick : r.heritages() == null ? List.<HeritagePick>of() : r.heritages()) {
            if (pick == null) continue;
            Optional<RuleHeritage> found = rules.heritage(pick.id());
            if (found.isEmpty()) {
                b.errors.add("Herança desconhecida.");
                continue;
            }
            RuleHeritage h = found.get();
            byId.put(h.id(), h);
            times.merge(h.id(), 1, Integer::sum);
            if (!blank(pick.option())) options.putIfAbsent(h.id(), pick.option());
        }

        b.pools.keySet().forEach(scope -> b.spent.put(scope, 0));
        int generals = 0;
        boolean overflow = false;
        for (Map.Entry<String, Integer> e : times.entrySet()) {
            RuleHeritage h = byId.get(e.getKey());
            int t = e.getValue();
            String reason = blockReason(h, b, times.keySet());
            if (reason != null) b.errors.add("Herança " + h.name() + ": " + reason + ".");
            if (t > h.maxTimesOrOne()) {
                b.errors.add(h.maxTimesOrOne() == 1 ? h.name() + " só pode ser escolhida uma vez."
                        : h.name() + " pode ser escolhida no máximo " + h.maxTimesOrOne() + " vezes.");
            }
            String option = options.get(h.id());
            if (h.optionsOrEmpty().isEmpty()) {
                option = null;
            } else if (option == null || !h.optionsOrEmpty().contains(option)) {
                b.errors.add("Escolha a opção de " + h.name() + ".");
                option = null;
            }
            for (int i = 0; i < t; i++) {
                if (h.category() == HeritageCategory.GENERAL) generals++;
                else if (!b.spend(h.category() == HeritageCategory.REGION ? "REGION" : "ORIGIN", "ANY")) overflow = true;
            }
            HeritageLine line = new HeritageLine(h.id(), h.name(), h.category(), option, t);
            b.heritages.add(line);
            b.features.add(new Sourced<>(Grant.heritage(displayName(line), h.description()), "Herança"));
        }
        // As Gerais por último: usam o ponto que sobrar, de qualquer tipo.
        for (int i = 0; i < generals; i++) {
            if (!b.spend("REGION", "ORIGIN", "ANY")) overflow = true;
        }
        if (overflow) b.errors.add("Você escolheu mais Heranças do que tem pontos.");

        boolean canBuy = false;
        for (RuleHeritage h : rules.catalog().heritagesOrEmpty()) {
            String reason = blockReason(h, b, times.keySet());
            int t = times.getOrDefault(h.id(), 0);
            if (reason == null && t < h.maxTimesOrOne()) canBuy = true;
            b.heritageOptions.add(new HeritageStatus(h.id(), reason == null, reason, t));
        }
        int left = b.heritagePoints - b.heritagesSpent();
        if (left > 0 && canBuy) {
            b.errors.add(left == 1 ? "Gaste o ponto de Herança que falta." : "Gaste os " + left + " pontos de Herança que faltam.");
        }
    }

    // Por que a Herança não pode ser escolhida agora (null = pode). Na criação vale tudo que é "Inicial".
    private String blockReason(RuleHeritage h, Build b, Set<String> chosen) {
        if (h.category() == null) return "sem tipo";
        if (b.pools.keySet().stream().noneMatch(scope -> allows(scope, h.category()))) {
            if (b.pools.isEmpty()) return "você não tem pontos de Herança";
            return h.category() == HeritageCategory.REGION ? "seus pontos não compram Heranças de Região"
                    : "seus pontos não compram Heranças de Origem";
        }
        String pre = "pré-requisito: " + (h.prerequisite() == null ? "não atendido" : h.prerequisite());
        if (!h.originsOrEmpty().isEmpty()
                && (b.origin == null || h.originsOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.origin.id())))) {
            return pre;
        }
        if (!h.lineagesOrEmpty().isEmpty()
                && (b.lineage == null || h.lineagesOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.lineage.id())))) {
            return pre;
        }
        if (!h.regionsOrEmpty().isEmpty()
                && (b.region == null || h.regionsOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.region.id())))) {
            return pre;
        }
        if (!h.classesOrEmpty().isEmpty()
                && (b.klass == null || h.classesOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.klass.id())))) {
            return pre;
        }
        if (h.minAttributes() != null && h.minAttributes().entrySet().stream().anyMatch(e -> b.total(e.getKey()) < e.getValue())) {
            return pre;
        }
        for (String other : h.excludesOrEmpty()) {
            if (chosen.stream().anyMatch(c -> c.equalsIgnoreCase(other))) {
                return "não pode junto com " + rules.heritage(other).map(RuleHeritage::name).orElse(other);
            }
        }
        return null;
    }

    static boolean allows(String scope, HeritageCategory category) {
        return switch (scope) {
            case "REGION" -> category == HeritageCategory.REGION || category == HeritageCategory.GENERAL;
            case "ORIGIN" -> category == HeritageCategory.ORIGIN || category == HeritageCategory.GENERAL;
            default -> true;
        };
    }

    // "Variante Meio-Vastaya (Marai)", "Variante Colosso (2×)".
    static String displayName(HeritageLine h) {
        String name = h.name();
        if (h.option() != null) name += " (" + h.option() + ")";
        if (h.times() > 1) name += " (" + h.times() + "×)";
        return name;
    }

    // Escolha que só vale quando há opções: sem opções cadastradas, mostra o aviso (note) e não bloqueia a criação.
    private static ChoiceLine optionalChoice(String key, Grant g, String label, List<String> options, List<String> picked,
                                             String source, Build b, String note, Consumer<String> apply) {
        if (options.isEmpty()) {
            return new ChoiceLine(key, g.type(), label, g.count(), options, List.of(), source, note);
        }
        int count = Math.min(g.count(), options.size());
        List<String> selected = choose(picked, options, count, label, b.errors);
        selected.forEach(apply);
        return new ChoiceLine(key, g.type(), label, count, options, selected, source, null);
    }

    // Valida os atributos base de acordo com o método (compra de pontos, arranjo padrão ou manual).
    private static void baseAttributes(CreationRequest r, AttributeMethods methods, Build b) {
        Map<Attribute, Integer> given = r.baseAttributes() == null ? Map.of() : r.baseAttributes();
        for (Attribute a : Attribute.values()) b.base.put(a, given.get(a));
        boolean missing = b.base.values().stream().anyMatch(v -> v == null);
        String method = r.attributeMethod();

        if (method == null) {
            b.errors.add("Defina os atributos.");
            return;
        }
        if (missing) b.errors.add("Defina todos os seis atributos.");
        switch (method) {
            case "POINT_BUY" -> {
                AttributeMethods.PointBuy pb = methods.pointBuy();
                if (pb == null) {
                    b.errors.add("A compra de pontos está desligada.");
                    return;
                }
                int spent = 0;
                boolean outOfRange = false;
                for (Integer v : b.base.values()) {
                    if (v == null) continue;
                    if (v < pb.min() || v > pb.max()) outOfRange = true;
                    else spent += pb.costs().get(String.valueOf(v));
                }
                b.pointBuy = new PointBuyStatus(spent, pb.points());
                if (outOfRange) b.errors.add("Na compra de pontos, cada atributo vai de " + pb.min() + " a " + pb.max() + ".");
                if (spent > pb.points()) b.errors.add("Você gastou " + spent + " de " + pb.points() + " pontos.");
            }
            case "STANDARD_ARRAY" -> {
                List<Integer> array = methods.standardArray();
                if (array == null) {
                    b.errors.add("O arranjo padrão está desligado.");
                    return;
                }
                List<Integer> used = b.base.values().stream().filter(v -> v != null).sorted().toList();
                if (!missing && !used.equals(array.stream().sorted().toList())) {
                    b.errors.add("Use cada valor do arranjo padrão uma vez: " + array + ".");
                }
            }
            case "MANUAL" -> {
                AttributeMethods.Range range = methods.manual();
                if (range == null) {
                    b.errors.add("Atributos manuais estão desligados.");
                    return;
                }
                if (b.base.values().stream().anyMatch(v -> v != null && (v < range.min() || v > range.max()))) {
                    b.errors.add("Cada atributo vai de " + range.min() + " a " + range.max() + ".");
                }
            }
            default -> b.errors.add("Método de atributos desconhecido.");
        }
    }

    // Limpa as opções escolhidas: tira repetidas e inválidas; avisa se faltou ou sobrou.
    private static List<String> choose(List<String> picked, List<String> options, int count, String label, List<String> errors) {
        List<String> clean = new ArrayList<>(new LinkedHashSet<>(picked == null ? List.of() : picked));
        if (clean.removeIf(o -> !options.contains(o))) errors.add("Opção inválida em \"" + label + "\".");
        if (clean.size() > count) {
            errors.add("Escolha só " + count + " em \"" + label + "\".");
            clean = clean.subList(0, count);
        }
        if (clean.size() < count) errors.add("Faltam escolhas: " + label + ".");
        return List.copyOf(clean);
    }

    private static <T> T pick(String id, Function<String, Optional<T>> find, String missing, String unknown, List<String> errors) {
        if (blank(id)) {
            errors.add(missing);
            return null;
        }
        Optional<T> found = find.apply(id);
        if (found.isEmpty()) errors.add(unknown);
        return found.orElse(null);
    }

    private static List<String> orAll(List<String> options, Enum<?>[] all) {
        if (options != null && !options.isEmpty()) return options;
        return Arrays.stream(all).map(Enum::name).toList();
    }

    private static String orLabel(Grant g, String fallback) {
        return g.label() != null ? g.label() : fallback;
    }

    // Usos de uma habilidade no bônus de proficiência dado (mínimo 1 quando escala).
    static Integer usesFor(Grant g, int proficiency, boolean roundUp) {
        return usesFor(g, proficiency, roundUp, a -> 0);
    }

    static Integer usesFor(Grant g, int proficiency, boolean roundUp, ToIntFunction<Attribute> modifier) {
        UsesFormula formula = g.usesFormula() == null ? UsesFormula.FIXED : g.usesFormula();
        return switch (formula) {
            case FIXED -> g.maxUses();
            case PROFICIENCY -> proficiency;
            case HALF_PROFICIENCY -> Math.max(1, roundUp ? (proficiency + 1) / 2 : proficiency / 2);
            case ATTRIBUTE_MODIFIER -> Math.max(1, modifier.applyAsInt(g.attribute()));
        };
    }

    // Dado da habilidade: o da tabela por proficiência (maior bônus <= o atual) ou o "damage" fixo.
    // PV de uma concessão HP_BONUS em um nível: amount fixo ou a fórmula (ex.: metade do bônus de proficiência).
    static int hpBonusFor(Grant g, int proficiency, boolean roundUp) {
        if (g.usesFormula() == null || g.usesFormula() == UsesFormula.FIXED) return g.amount() == null ? 0 : g.amount();
        return g.usesFormula() == UsesFormula.PROFICIENCY ? proficiency : half(proficiency, roundUp);
    }

    static int half(int value, boolean roundUp) {
        return roundUp ? (value + 1) / 2 : value / 2;
    }

    // Dado com os bônus de damageBonus já somados: "1d6" + proficiência (2) + Força (+3) = "1d6+5".
    static String damageFor(Grant g, int proficiency, boolean roundUp, ToIntFunction<Attribute> modifier) {
        String dice = diceFor(g, proficiency);
        if (dice == null || g.damageBonus() == null || g.damageBonus().isEmpty()) return dice;
        Matcher m = DICE_WITH_BONUS.matcher(dice);
        if (!m.matches()) return dice;
        int bonus = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        for (String token : g.damageBonus()) {
            bonus += switch (token) {
                case "PROFICIENCY" -> proficiency;
                case "HALF_PROFICIENCY" -> half(proficiency, roundUp);
                default -> modifier.applyAsInt(Attribute.valueOf(token));
            };
        }
        return m.group(1) + (bonus == 0 ? "" : bonus > 0 ? "+" + bonus : String.valueOf(bonus));
    }

    static String diceFor(Grant g, int proficiency) {
        if (g.diceByProficiency() == null || g.diceByProficiency().isEmpty()) {
            return g.damage() == null ? null : g.damage().replace(" ", "");
        }
        return g.diceByProficiency().entrySet().stream()
                .filter(e -> Integer.parseInt(e.getKey()) <= proficiency)
                .max(Map.Entry.comparingByKey((a, c) -> Integer.compare(Integer.parseInt(a), Integer.parseInt(c))))
                .map(e -> e.getValue().replace(" ", ""))
                .orElse(null);
    }

    private Background backgroundEntity(RuleOption option) {
        return backgrounds.findByNameIgnoreCase(option.name()).orElseGet(() -> {
            Background bg = new Background();
            bg.setName(option.name());
            option.grantsOrEmpty().stream()
                    .filter(g -> g.type() == GrantType.SKILL)
                    .forEach(g -> bg.getSkills().add(g.skill()));
            return backgrounds.save(bg);
        });
    }

    private CharacterAbility abilityFrom(Character c, Grant g, int proficiency) {
        AbilityType type = g.abilityType() == null ? AbilityType.PASSIVE : g.abilityType();
        Integer uses = usesFor(g, proficiency, rules.roundsUp(), c::getModifier);
        CharacterAbility a = new CharacterAbility();
        a.setCharacter(c);
        a.setName(g.name());
        a.setType(type);
        a.setSpellLevel(type == AbilityType.SPELL ? (g.spellLevel() == null ? 0 : g.spellLevel()) : null);
        a.setCastingTime(g.castingTime());
        a.setAbilityRange(g.range());
        a.setDuration(g.duration());
        a.setComponents(g.components());
        a.setDamage(damageFor(g, proficiency, rules.roundsUp(), c::getModifier));
        a.setDescription(g.description());
        a.setMaxUses(uses);
        a.setUsesLeft(uses);
        a.setRecharge(uses == null ? Recharge.NONE : g.recharge() == null ? Recharge.LONG_REST : g.recharge());
        return a;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private record Source(String key, String label, List<Grant> grants) {}

    private record Sourced<T>(T value, String source) {}

    // Resultado do cálculo (rascunho da ficha).
    private static final class Build {
        RuleOption origin;
        RuleLineage lineage;
        RuleOption region;
        RuleClass klass;
        RuleOption background;
        boolean roundUp;
        final Map<Attribute, Integer> base = new EnumMap<>(Attribute.class);
        final Map<Attribute, Integer> bonus = new EnumMap<>(Attribute.class);
        PointBuyStatus pointBuy;
        final Map<SkillType, String> skills = new LinkedHashMap<>();
        final Map<Attribute, String> saves = new LinkedHashMap<>();
        final List<Sourced<Grant>> features = new ArrayList<>();
        final List<ChoiceLine> choices = new ArrayList<>();
        final Set<String> languages = new LinkedHashSet<>();
        final Set<String> crafts = new LinkedHashSet<>();
        final List<String> errors = new ArrayList<>();
        // Pontos de Herança por tipo (REGION/ORIGIN/ANY) e quantos já foram gastos de cada.
        final Map<String, Integer> pools = new LinkedHashMap<>();
        final Map<String, Integer> spent = new LinkedHashMap<>();
        final List<HeritageLine> heritages = new ArrayList<>();
        final List<HeritageStatus> heritageOptions = new ArrayList<>();
        CreatureSize size;
        int hpBonus;
        int heritagePoints;
        double baseSpeed;
        double speedBonus;
        int gold;

        // Atributo sem valor base conta como 10 só para a prévia (a criação exige os seis).
        int total(Attribute a) {
            return (base.get(a) == null ? 10 : base.get(a)) + bonus.getOrDefault(a, 0);
        }

        int modifier(Attribute a) {
            return Math.floorDiv(total(a) - 10, 2);
        }

        int maxHp() {
            return klass == null ? 0 : Math.max(1, klass.hitDie() + modifier(Attribute.CONSTITUTION) + hpBonus);
        }

        double speed() {
            return baseSpeed + speedBonus;
        }

        // Gasta 1 ponto do primeiro tipo (na ordem dada) que ainda tiver saldo.
        boolean spend(String... scopes) {
            for (String scope : scopes) {
                if (spent.getOrDefault(scope, 0) < pools.getOrDefault(scope, 0)) {
                    spent.merge(scope, 1, Integer::sum);
                    return true;
                }
            }
            return false;
        }

        int heritagesSpent() {
            return spent.values().stream().mapToInt(Integer::intValue).sum();
        }

        CreationPreview toPreview() {
            List<AttributeLine> attrs = Arrays.stream(Attribute.values())
                    .map(a -> new AttributeLine(a, base.get(a), bonus.getOrDefault(a, 0), total(a), modifier(a)))
                    .toList();
            List<SkillLine> skillLines = skills.entrySet().stream().map(e -> new SkillLine(e.getKey(), e.getValue())).toList();
            List<SaveLine> saveLines = saves.entrySet().stream().map(e -> new SaveLine(e.getKey(), e.getValue())).toList();
            List<FeatureLine> featureLines = features.stream()
                    .map(f -> new FeatureLine(f.value().name(), f.value().description(),
                            f.value().abilityType() == null ? AbilityType.PASSIVE : f.value().abilityType(),
                            damageFor(f.value(), LEVEL_ONE_PROFICIENCY, roundUp, this::modifier), usesFor(f.value(), LEVEL_ONE_PROFICIENCY, roundUp, this::modifier),
                            f.source()))
                    .toList();
            return new CreationPreview(attrs, pointBuy, skillLines, saveLines, featureLines, List.copyOf(choices),
                    maxHp(), klass == null ? 0 : klass.hitDie(), speed(), gold, size, List.copyOf(languages),
                    List.copyOf(crafts), heritagePoints,
                    pools.entrySet().stream()
                            .map(e -> new HeritagePool(e.getKey(), e.getValue(), spent.getOrDefault(e.getKey(), 0)))
                            .toList(),
                    List.copyOf(heritages), List.copyOf(heritageOptions), List.copyOf(errors), errors.isEmpty());
        }
    }
}
