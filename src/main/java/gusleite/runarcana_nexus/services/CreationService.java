package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.enums.MovementType;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.enums.UsesFormula;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.ArmorRule;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import gusleite.runarcana_nexus.model.player.CharacterSkill;
import gusleite.runarcana_nexus.model.player.ClassLevel;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CreationPreview;
import gusleite.runarcana_nexus.record.CreationPreview.AttributeLine;
import gusleite.runarcana_nexus.record.CreationPreview.ChoiceLine;
import gusleite.runarcana_nexus.record.CreationPreview.ClassLevelLine;
import gusleite.runarcana_nexus.record.CreationPreview.EquipmentLine;
import gusleite.runarcana_nexus.record.CreationPreview.FeatureLine;
import gusleite.runarcana_nexus.record.CreationPreview.HeritageLine;
import gusleite.runarcana_nexus.record.CreationPreview.HeritagePool;
import gusleite.runarcana_nexus.record.CreationPreview.HeritageStatus;
import gusleite.runarcana_nexus.record.CreationPreview.PointBuyStatus;
import gusleite.runarcana_nexus.record.CreationPreview.SaveLine;
import gusleite.runarcana_nexus.record.CreationPreview.SkillLine;
import gusleite.runarcana_nexus.record.CreationPreview.StartingWealth;
import gusleite.runarcana_nexus.record.CreationPreview.TraitBudgetStatus;
import gusleite.runarcana_nexus.record.CreationPreview.TraitLine;
import gusleite.runarcana_nexus.record.CreationPreview.TraitStatus;
import gusleite.runarcana_nexus.record.CreationRequest;
import gusleite.runarcana_nexus.record.CreationRequest.LevelPick;
import gusleite.runarcana_nexus.record.LevelUpPreview;
import gusleite.runarcana_nexus.record.LevelUpRequest;
import gusleite.runarcana_nexus.record.PreparationResponse;
import gusleite.runarcana_nexus.record.SpeedLine;
import gusleite.runarcana_nexus.record.CreationRequest.HeritagePick;
import gusleite.runarcana_nexus.record.CreationRequest.TraitPick;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterAbilityRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.rules.ArmorFormula;
import gusleite.runarcana_nexus.rules.AttributeMethods;
import gusleite.runarcana_nexus.rules.Grant;
import gusleite.runarcana_nexus.rules.HeritageCondition;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.rules.RuleMagic;
import gusleite.runarcana_nexus.rules.RuleClass;
import gusleite.runarcana_nexus.rules.RuleHeritage;
import gusleite.runarcana_nexus.rules.RuleLineage;
import gusleite.runarcana_nexus.rules.RuleOption;
import gusleite.runarcana_nexus.rules.RuleResource;
import gusleite.runarcana_nexus.rules.RuleTrait;
import gusleite.runarcana_nexus.rules.RuleTraits;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.security.SecureRandom;
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
import java.util.random.RandomGenerator;
import java.util.regex.Pattern;

// Criação de personagem pelo assistente. evaluate() aplica as concessões do catálogo às escolhas
// e é usado tanto na prévia (ficha em construção) quanto na criação, para as duas nunca divergirem.
@Service
public class CreationService {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RandomGenerator RANDOM = new SecureRandom();
    // Bônus de proficiência no 1º nível (a ficha nasce no nível 1).
    private static final int LEVEL_ONE_PROFICIENCY = 2;
    // Nível do personagem na criação (tabelas usesByLevel, diceByLevel e valueByLevel).
    static final int CREATION_LEVEL = 1;
    private static final double DEFAULT_SPEED_FEET = 30;
    private static final Pattern DICE_WITH_BONUS = Pattern.compile("^(\\d+d\\d+)([+-]\\d+)?$");

    private final RuleCatalogService rules;
    private final CharacterService characterService;
    private final CharacterRepository characters;
    private final CharacterClassRepository classes;
    private final BackGroundRepository backgrounds;
    private final CharacterAbilityRepository abilities;
    private final TableSettingsService settings;
    private final StartingEquipmentService startingEquipment;

    public CreationService(RuleCatalogService rules, CharacterService characterService, CharacterRepository characters,
                           CharacterClassRepository classes, BackGroundRepository backgrounds,
                           CharacterAbilityRepository abilities, TableSettingsService settings,
                           StartingEquipmentService startingEquipment) {
        this.rules = rules;
        this.characterService = characterService;
        this.characters = characters;
        this.classes = classes;
        this.backgrounds = backgrounds;
        this.abilities = abilities;
        this.settings = settings;
        this.startingEquipment = startingEquipment;
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
        c.setSubclass(b.subclass == null ? null : b.subclass.name());
        c.getArmorProficiencies().addAll(b.armorProficiencies);
        c.getWeaponProficiencies().addAll(b.weaponProficiencies);
        c.setStr(b.total(Attribute.STRENGTH));
        c.setDex(b.total(Attribute.DEXTERITY));
        c.setCon(b.total(Attribute.CONSTITUTION));
        c.setIntel(b.total(Attribute.INTELLIGENCE));
        c.setWis(b.total(Attribute.WISDOM));
        c.setCha(b.total(Attribute.CHARISMA));
        c.setMaxHp(b.maxHp());
        c.setCurrentHp(b.maxHp());
        c.setSpeed(b.speed());
        c.getOtherSpeeds().putAll(b.otherSpeedsTotal());
        c.getArmorRules().addAll(b.armorRules);
        c.setSize(b.size);
        c.getLanguages().addAll(b.languages);
        // A ficha guarda o nome do ofício (não o id do catálogo), para mostrar sem depender do catálogo.
        Map<String, String> craftNames = new LinkedHashMap<>();
        rules.catalog().craftsOrEmpty().forEach(k -> craftNames.put(k.id(), k.name()));
        b.crafts.forEach(id -> c.getCrafts().add(craftNames.getOrDefault(id, id)));
        b.craftExpertise.forEach(id -> c.getCraftExpertise().add(craftNames.getOrDefault(id, id)));
        // Os pontos da criação são gastos no assistente; a ficha guarda o que sobrou (normalmente 0).
        c.setHeritagePoints(b.heritagePoints - b.heritagesSpent());
        b.heritages.forEach(h -> c.getHeritages().add(displayName(h)));
        // Riqueza inicial: os dados da classe são rolados agora, no lugar do equipamento.
        c.setGold(b.gold + (b.wealth ? EquipmentRules.rollWealth(b.wealthFormula, RANDOM) : 0));
        c.setInspiration(0);
        c.getSavingThrows().addAll(b.saves.keySet());
        c.setBuild(JSON.writeValueAsString(request));
        for (SkillType skill : b.skills.keySet()) {
            CharacterSkill s = new CharacterSkill();
            s.setCharacter(c);
            s.setSkillType(skill);
            s.setProficient(true);
            s.setExpertise(b.expertise.contains(skill));
            c.getSkills().add(s);
        }
        c.getClassLevels().addAll(classLevelsOf(b));
        characters.save(c);

        for (Sourced<Grant> f : b.features) {
            CharacterAbility a = abilityFrom(c, f.value(), b.proficiency(), b.scale(f.source()));
            a.setSource(f.source());
            markPreparable(a, f, b);
            abilities.save(a);
        }
        startingEquipment.give(c, b.equipment);
        return CharacterResponse.of(c);
    }

    // ---------- Subida de nível (rota do mestre) ----------

    // A ficha recalculada com os níveis novos, sem salvar.
    public LevelUpPreview levelUpPreview(Long characterId, LevelUpRequest request) {
        Character c = leveled(characterId);
        CreationRequest base = buildOf(c);
        Build before = evaluate(base);
        Build after = evaluate(withLevels(base, request));
        Map<String, Integer> had = new LinkedHashMap<>();
        before.features.forEach(f -> had.merge(f.value().name() + "|" + f.source(), 1, Integer::sum));
        List<FeatureLine> lines = after.toPreview().features();
        List<FeatureLine> fresh = new ArrayList<>();
        for (FeatureLine f : lines) {
            String k = f.name() + "|" + f.source();
            if (had.getOrDefault(k, 0) > 0) had.merge(k, -1, Integer::sum);
            else fresh.add(f);
        }
        List<String> changes = new ArrayList<>();
        for (Attribute a : Attribute.values()) {
            int now = attributeOf(c, a);
            if (after.total(a) != now) changes.add(ATTRIBUTE_ABBREVIATIONS.get(a) + " " + now + " → " + after.total(a));
        }
        int newMax = after.klass == null ? c.getMaxHp() : after.maxHp();
        return new LevelUpPreview(after.toPreview(), c.getLevel(), after.level, c.getMaxHp(), newMax, newMax - c.getMaxHp(),
                List.copyOf(changes), List.copyOf(fresh));
    }

    // Aplica os níveis novos: refaz atributos, PV (a diferença também no PV atual), perícias, proficiências e as
    // habilidades do assistente. Não mexe em ouro, inventário, inspiração, defesa escolhida nem nas habilidades
    // que o mestre cadastrou à mão; os usos gastos continuam gastos.
    @Transactional
    public CharacterResponse levelUp(Long characterId, LevelUpRequest request) {
        Character c = leveled(characterId);
        CreationRequest next = withLevels(buildOf(c), request);
        Build b = evaluate(next);
        if (!b.errors.isEmpty()) {
            throw ApiException.badRequest(b.errors.getFirst());
        }
        int oldMax = c.getMaxHp();
        int newMax = b.maxHp();
        c.setLevel(b.level);
        c.setMaxHp(newMax);
        c.setCurrentHp(Math.max(0, Math.min(newMax, c.getCurrentHp() + newMax - oldMax)));
        c.setStr(b.total(Attribute.STRENGTH));
        c.setDex(b.total(Attribute.DEXTERITY));
        c.setCon(b.total(Attribute.CONSTITUTION));
        c.setIntel(b.total(Attribute.INTELLIGENCE));
        c.setWis(b.total(Attribute.WISDOM));
        c.setCha(b.total(Attribute.CHARISMA));
        c.setSubclass(b.subclass == null ? null : b.subclass.name());
        c.setSpeed(b.speed());
        c.getOtherSpeeds().clear();
        c.getOtherSpeeds().putAll(b.otherSpeedsTotal());
        c.getArmorRules().clear();
        c.getArmorRules().addAll(b.armorRules);
        c.setSize(b.size);
        replace(c.getArmorProficiencies(), b.armorProficiencies);
        replace(c.getWeaponProficiencies(), b.weaponProficiencies);
        replace(c.getLanguages(), b.languages);
        Map<String, String> craftNames = new LinkedHashMap<>();
        rules.catalog().craftsOrEmpty().forEach(k -> craftNames.put(k.id(), k.name()));
        replace(c.getCrafts(), b.crafts.stream().map(id -> craftNames.getOrDefault(id, id)).toList());
        replace(c.getCraftExpertise(), b.craftExpertise.stream().map(id -> craftNames.getOrDefault(id, id)).toList());
        c.setHeritagePoints(b.heritagePoints - b.heritagesSpent());
        replace(c.getHeritages(), b.heritages.stream().map(CreationService::displayName).toList());
        replace(c.getSavingThrows(), b.saves.keySet());
        // Perícias: as linhas que já existem são atualizadas (sem apagar), as novas entram.
        for (CharacterSkill s : c.getSkills()) {
            s.setProficient(b.skills.containsKey(s.getSkillType()));
            s.setExpertise(b.expertise.contains(s.getSkillType()));
        }
        for (SkillType skill : b.skills.keySet()) {
            if (c.getSkills().stream().anyMatch(s -> s.getSkillType() == skill)) continue;
            CharacterSkill s = new CharacterSkill();
            s.setCharacter(c);
            s.setSkillType(skill);
            s.setProficient(true);
            s.setExpertise(b.expertise.contains(skill));
            c.getSkills().add(s);
        }
        c.getClassLevels().clear();
        c.getClassLevels().addAll(classLevelsOf(b));
        c.setBuild(JSON.writeValueAsString(next));
        characters.save(c);
        syncAbilities(c, b);
        return CharacterResponse.of(c);
    }

    private static final Map<Attribute, String> ATTRIBUTE_ABBREVIATIONS = Map.of(Attribute.STRENGTH, "FOR",
            Attribute.DEXTERITY, "DES", Attribute.CONSTITUTION, "CON", Attribute.INTELLIGENCE, "INT", Attribute.WISDOM, "SAB",
            Attribute.CHARISMA, "CAR");

    private Character leveled(Long characterId) {
        return characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
    }

    // As escolhas guardadas na criação (e nos níveis anteriores).
    private CreationRequest buildOf(Character c) {
        if (c.getBuild() == null) {
            throw ApiException.badRequest("Esta ficha não foi criada pelo assistente: a subida de nível precisa das escolhas da criação.");
        }
        return JSON.readValue(c.getBuild(), CreationRequest.class);
    }

    private static CreationRequest withLevels(CreationRequest base, LevelUpRequest request) {
        if (request == null || request.levelsOrEmpty().isEmpty()) throw ApiException.badRequest("Informe o nível novo.");
        if (1 + base.levelsOrEmpty().size() + request.levelsOrEmpty().size() > MAX_LEVEL) {
            throw ApiException.badRequest("O nível máximo é o " + MAX_LEVEL + "º.");
        }
        CreationRequest next = base;
        for (LevelPick pick : request.levelsOrEmpty()) next = next.withLevel(pick);
        return next;
    }

    private static int attributeOf(Character c, Attribute a) {
        return switch (a) {
            case STRENGTH -> c.getStr();
            case DEXTERITY -> c.getDex();
            case CONSTITUTION -> c.getCon();
            case INTELLIGENCE -> c.getIntel();
            case WISDOM -> c.getWis();
            case CHARISMA -> c.getCha();
        };
    }

    private static <T> void replace(java.util.Collection<T> target, java.util.Collection<T> values) {
        target.clear();
        target.addAll(values);
    }

    private static List<ClassLevel> classLevelsOf(Build b) {
        return b.classLevelLines().stream().map(l -> new ClassLevel(l.classId(), l.name(), l.level(), l.subclass())).toList();
    }

    // Habilidades do assistente refeitas no nível novo. Cada uma acha a antiga pelo nome (a de mesma fonte primeiro;
    // fichas de antes desta mudança não têm fonte) e é atualizada no lugar, mantendo ícone e usos gastos. As antigas
    // com fonte que não existem mais saem; as sem fonte que sobraram são do mestre e ficam.
    private void syncAbilities(Character c, Build b) {
        List<CharacterAbility> existing = new ArrayList<>(abilities.findByCharacterOrderByIdAsc(c));
        for (Sourced<Grant> f : b.features) {
            CharacterAbility fresh = abilityFrom(c, f.value(), b.proficiency(), b.scale(f.source()));
            CharacterAbility old = existing.stream().filter(a -> a.getName().equals(fresh.getName()) && f.source().equals(a.getSource()))
                    .findFirst()
                    .orElseGet(() -> existing.stream().filter(a -> a.getName().equals(fresh.getName()) && a.getSource() == null)
                            .findFirst().orElse(null));
            if (old == null) {
                fresh.setSource(f.source());
                markPreparable(fresh, f, b);
                abilities.save(fresh);
                continue;
            }
            existing.remove(old);
            Integer spent = old.getMaxUses() == null || old.getUsesLeft() == null ? null : old.getMaxUses() - old.getUsesLeft();
            old.setType(fresh.getType());
            old.setSpellLevel(fresh.getSpellLevel());
            old.setCastingTime(fresh.getCastingTime());
            old.setAbilityRange(fresh.getAbilityRange());
            old.setDuration(fresh.getDuration());
            old.setComponents(fresh.getComponents());
            old.setDamage(fresh.getDamage());
            old.setDescription(fresh.getDescription());
            old.setRecharge(fresh.getRecharge());
            old.setMaxUses(fresh.getMaxUses());
            old.setUsesLeft(fresh.getMaxUses() == null ? null : Math.max(0, fresh.getMaxUses() - (spent == null ? 0 : spent)));
            old.setSource(f.source());
            abilities.save(old);
        }
        // As magias preparadas do Acólito não vêm do assistente: ficam até o próximo descanso longo.
        existing.stream().filter(a -> a.getSource() != null && !a.getSource().startsWith(PREPARED)).forEach(abilities::delete);
    }

    // ---------- Magias preparadas (Acólito, Xamã) ----------

    // Fonte das magias preparadas da lista da classe ("Magias preparadas: Acólito").
    static final String PREPARED = "Magias preparadas: ";

    // Feitiço conhecido (1º nível ou mais) de uma classe que prepara entre os conhecidos (Xamã): nasce não preparado.
    private static void markPreparable(CharacterAbility a, Sourced<Grant> f, Build b) {
        if (a.getType() != AbilityType.SPELL || a.getSpellLevel() == null || a.getSpellLevel() < 1) return;
        RuleClass k = b.classById.get(b.sourceClass.get(f.source()));
        if (k != null && k.preparation() != null && RuleClass.Preparation.KNOWN.equals(k.preparation().from())) a.setPrepared(false);
    }

    // O que o jogador pode preparar agora, por classe que prepara.
    @Transactional(readOnly = true)
    public PreparationResponse preparation(Account account) {
        return preparationOf(characterService.characterOf(account));
    }

    // Troca as preparadas (só no descanso longo). picks: classe → chaves das opções; classe fora de picks não muda.
    @Transactional
    public void prepare(Account account, Map<String, List<String>> picks) {
        Character c = characterService.characterOf(account);
        PreparationResponse now = preparationOf(c);
        Map<String, RuleMagic.Spell> spells = new LinkedHashMap<>();
        if (rules.catalog().magic() != null) rules.catalog().magic().spellsOrEmpty().forEach(sp -> spells.put(sp.id(), sp));
        List<CharacterAbility> mine = abilities.findByCharacterOrderByIdAsc(c);
        for (Map.Entry<String, List<String>> e : picks.entrySet()) {
            PreparationResponse.PreparingClass pc = now.classes().stream().filter(x -> x.classId().equalsIgnoreCase(e.getKey()))
                    .findFirst().orElseThrow(() -> ApiException.badRequest("Sua ficha não prepara magias dessa classe."));
            List<String> chosen = List.copyOf(new LinkedHashSet<>(e.getValue() == null ? List.<String>of() : e.getValue()));
            if (chosen.size() > pc.limit()) {
                throw ApiException.badRequest("Você prepara no máximo " + pc.limit() + " magia(s) de " + pc.name() + ".");
            }
            Set<String> valid = new LinkedHashSet<>();
            pc.options().forEach(o -> valid.add(o.key()));
            if (!valid.containsAll(chosen)) throw ApiException.badRequest("Há magia que " + pc.name() + " não pode preparar agora.");
            if (pc.maxSpellLevel() == null) {
                // Entre os conhecidos: só a marca muda.
                for (CharacterAbility a : mine) {
                    if (!valid.contains("ability:" + a.getId())) continue;
                    a.setPrepared(chosen.contains("ability:" + a.getId()));
                    abilities.save(a);
                }
                continue;
            }
            String label = PREPARED + pc.name();
            mine.stream().filter(a -> label.equals(a.getSource())).forEach(abilities::delete);
            int level = c.getClassLevels().stream().filter(l -> l.getClassId().equals(pc.classId())).mapToInt(ClassLevel::getLevel)
                    .findFirst().orElse(c.getLevel());
            for (String key : chosen) {
                RuleMagic.Spell sp = spells.get(key.substring("spell:".length()));
                CharacterAbility a = abilityFrom(c, Grant.spell(sp), c.getProficiencyBonus(), level);
                a.setSource(label);
                a.setPrepared(true);
                a.setSpellId(sp.id());
                abilities.save(a);
            }
        }
    }

    private PreparationResponse preparationOf(Character c) {
        Build b = c.getBuild() == null ? null : evaluate(buildOf(c));
        Map<String, Integer> levels = new LinkedHashMap<>();
        if (b != null) levels.putAll(b.classLevels);
        else levels.put(c.getCharacterClass().getClassName().name(), c.getLevel());
        List<CharacterAbility> mine = abilities.findByCharacterOrderByIdAsc(c);
        RuleMagic magic = rules.catalog().magic();
        List<PreparationResponse.PreparingClass> out = new ArrayList<>();
        levels.forEach((id, lvl) -> {
            RuleClass k = rules.characterClass(id).orElse(null);
            if (k == null || k.preparation() == null) return;
            RuleClass.Preparation p = k.preparation();
            int limit = Math.max(1, c.getModifier(p.attribute()) + (RuleClass.Preparation.HALF.equals(p.levels()) ? lvl / 2 : lvl));
            List<PreparationResponse.Option> options = new ArrayList<>();
            List<String> prepared = new ArrayList<>();
            Integer max = null;
            if (RuleClass.Preparation.KNOWN.equals(p.from())) {
                for (CharacterAbility a : mine) {
                    if (a.getPrepared() == null || b == null || !id.equals(b.sourceClass.get(a.getSource()))) continue;
                    options.add(new PreparationResponse.Option("ability:" + a.getId(), a.getName(), a.getSpellLevel() == null ? 1 : a.getSpellLevel()));
                    if (a.getPrepared()) prepared.add("ability:" + a.getId());
                }
            } else {
                int top = 0;
                if (p.maxSpellLevel() != null) {
                    for (Map.Entry<String, Integer> e : p.maxSpellLevel().entrySet()) {
                        if (Integer.parseInt(e.getKey()) <= lvl) top = Math.max(top, e.getValue());
                    }
                }
                max = top;
                Set<String> mysteries = b == null ? Set.of() : b.mysteries;
                for (RuleMagic.Spell sp : magic == null ? List.<RuleMagic.Spell>of() : magic.spellsOrEmpty()) {
                    if (sp.level() == null || sp.level() < 1 || sp.level() > top) continue;
                    if (!sp.classesOrEmpty().contains(id) && sp.mysteriesOrEmpty().stream().noneMatch(mysteries::contains)) continue;
                    options.add(new PreparationResponse.Option("spell:" + sp.id(), sp.name(), sp.level()));
                }
                options.sort(java.util.Comparator.comparingInt(PreparationResponse.Option::level).thenComparing(PreparationResponse.Option::name));
                String label = PREPARED + k.name();
                mine.stream().filter(a -> label.equals(a.getSource()) && a.getSpellId() != null).forEach(a -> prepared.add("spell:" + a.getSpellId()));
            }
            out.add(new PreparationResponse.PreparingClass(id, k.name(), limit, max, List.copyOf(options), List.copyOf(prepared)));
        });
        return new PreparationResponse(List.copyOf(out));
    }

    // ---------- cálculo ----------

    private Build evaluate(CreationRequest r) {
        RuleCatalog catalog = rules.catalog();
        Build b = new Build();
        b.roundUp = rules.roundsUp();
        b.wealth = r.startingWealth();
        Map<String, List<String>> picks = r.choices() == null ? Map.of() : r.choices();
        b.level = 1 + r.levelsOrEmpty().size();

        b.origin = pick(r.originId(), rules::origin, "Escolha uma origem.", "Origem desconhecida.", b.errors);
        if (b.origin != null && !b.origin.lineagesOrEmpty().isEmpty()) {
            List<RuleLineage> lineages = b.origin.lineagesOrEmpty();
            b.lineage = pick(r.lineageId(), id -> lineages.stream().filter(l -> l.id().equalsIgnoreCase(id)).findFirst(),
                    "Escolha a linhagem.", "Linhagem desconhecida.", b.errors);
        }
        boolean traitOrigin = b.origin != null && b.origin.usesTraitsOrFalse();
        if (traitOrigin) traits(r, b);
        if (catalog.regions() != null && !catalog.regions().isEmpty()) {
            b.region = pick(r.regionId(), rules::region, "Escolha uma região.", "Região desconhecida.", b.errors);
        }
        b.klass = pick(r.classId(), rules::characterClass, "Escolha uma classe.", "Classe desconhecida.", b.errors);
        if (b.klass != null && !b.klass.subclassesOrEmpty().isEmpty()) {
            List<RuleLineage> subs = b.klass.subclassesOrEmpty();
            b.subclass = pick(r.subclassId(), id -> subs.stream().filter(x -> x.id().equalsIgnoreCase(id)).findFirst(),
                    "Escolha: " + subclassLabel(b.klass) + ".", "Subclasse desconhecida.", b.errors);
        }
        if (catalog.backgrounds() != null && !catalog.backgrounds().isEmpty()) {
            // Runinata só tem Passado com um traço que libera (Antecedente).
            if (traitOrigin && !b.traitBackground) {
                if (!blank(r.backgroundId())) b.errors.add("Sem o traço Antecedente, a Runinata não tem Passado.");
            } else {
                b.background = pick(r.backgroundId(), rules::background, "Escolha um passado.", "Passado desconhecido.", b.errors);
            }
        }

        // Fontes na ordem do assistente; a chave de cada escolha nasce daqui.
        List<Source> sources = new ArrayList<>();
        if (b.origin != null) sources.add(new Source("origin:" + b.origin.id(), "Origem: " + b.origin.name(), b.origin.grantsOrEmpty()));
        if (b.lineage != null) sources.add(new Source("lineage:" + b.lineage.id(), "Linhagem: " + b.lineage.name(), b.lineage.grantsOrEmpty()));
        sources.addAll(b.traitSources);
        if (b.region != null) sources.add(new Source("region:" + b.region.id(), "Região: " + b.region.name(), b.region.grantsOrEmpty()));
        if (b.klass != null) sources.add(new Source("class:" + b.klass.id(), "Classe: " + b.klass.name(), b.klass.grantsOrEmpty()));
        if (b.subclass != null) sources.add(new Source("subclass:" + b.subclass.id(), subclassLabel(b.klass) + ": " + b.subclass.name(), b.subclass.grantsOrEmpty()));
        if (b.background != null) sources.add(new Source("background:" + b.background.id(), "Passado: " + b.background.name(), b.background.grantsOrEmpty()));
        if (!catalog.runicNatureOrEmpty().isEmpty()) sources.add(new Source("runic-nature", "Natureza Rúnica", catalog.runicNatureOrEmpty()));
        if (b.klass != null) {
            b.classLevels.put(b.klass.id(), 1);
            b.classById.put(b.klass.id(), b.klass);
            if (b.subclass != null) b.subclassByClass.put(b.klass.id(), b.subclass);
            b.sourceClass.put("Classe: " + b.klass.name(), b.klass.id());
            if (b.subclass != null) b.sourceClass.put(subclassLabel(b.klass) + ": " + b.subclass.name(), b.klass.id());
        }
        Map<String, List<String>> allPicks = new LinkedHashMap<>(picks);
        levelSources(r, b, sources, allPicks);
        picks = allPicks;

        resourceSources(sources, picks, b);
        baseAttributes(r, catalog.attributeMethods(), b);

        // 1ª passada: o que é fixo. 2ª: as escolhas (que não podem repetir algo já ganho).
        for (Source s : sources) {
            for (Grant g : s.grants()) {
                switch (g.type()) {
                    case ATTRIBUTE -> b.bonus.merge(g.attribute(), valueAt(g, g.amount(), b.scale(s.label())), Integer::sum);
                    case SKILL -> {
                        // "Caso já tenha, especialidade": decide no fim, depois de todas as perícias.
                        if (Boolean.TRUE.equals(g.expertise())) b.deferred.add(new Deferred(null, g, s.label()));
                        else b.skills.putIfAbsent(g.skill(), s.label());
                    }
                    case SAVING_THROW -> b.saves.putIfAbsent(g.attribute(), s.label());
                    case FEATURE -> {
                        if (!g.hasOptions()) b.features.add(new Sourced<>(g, s.label()));
                    }
                    // PV calculado no fim (maxHp), quando os atributos já estão definidos.
                    case HP_BONUS -> b.hpGrants.add(g);
                    case ARMOR_PROFICIENCY -> b.armorProficiencies.add(g.value());
                    case WEAPON_PROFICIENCY -> b.weaponProficiencies.add(g.value());
                    case SPEED -> {
                        // value: tipo de deslocamento (sem value = caminhada; ALL = todos os que o personagem tiver).
                        // usesFormula PROFICIENCY: feet × bônus de proficiência (Brisa de Impulso: 5 pés × bônus).
                        // valueByLevel: pés pelo nível (Aspecto Feral: Natação 30 → 35 no 6º...); o aumento "se já tiver" cresce junto.
                        double base = valueAt(g, g.feet() == null ? null : g.feet().intValue(), b.scale(s.label()));
                        double feet = g.usesFormula() == UsesFormula.PROFICIENCY ? base * b.proficiency() : base;
                        String mode = g.value() == null ? "WALK" : g.value();
                        switch (mode) {
                            case "WALK" -> b.speedBonus += feet;
                            case "ALL" -> b.allSpeedBonus += feet;
                            default -> {
                                // amount: aumento quando ele já tem esse deslocamento (Aptidão Marinha: natação 30, ou +15).
                                MovementType type = MovementType.valueOf(mode);
                                double gain = g.amount() != null && b.otherSpeeds.containsKey(type) ? g.amount() + (base - g.feet()) : feet;
                                b.otherSpeeds.merge(type, gain, Double::sum);
                            }
                        }
                    }
                    case GOLD -> b.gold += g.amount();
                    case MYSTERY -> b.mysteries.add(g.value());
                    case SPELL -> b.fixedSpells.putIfAbsent(g.value(), s.label());
                    case EQUIPMENT -> {
                        if (!b.wealth) addEquipment(b, g.value(), s.label());
                    }
                    case SIZE -> {
                        b.size = CreatureSize.valueOf(g.value());
                        b.sizeFixed = true;
                    }
                    case CRAFT -> b.crafts.add(g.value());
                    case LANGUAGE -> b.languages.add(g.value());
                    case ARMOR_CLASS -> {
                        // Com feature: decide depois das escolhas (vale só se a opção foi escolhida).
                        if (g.armor() != null && g.armor().feature() != null) b.optionArmor.add(g);
                        else if (!g.hasOptions()) b.armorRules.add(armorRule(g, null));
                    }
                    case AC_BONUS -> b.armorRules.add(armorBonus(g, b.scale(s.label())));
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
                    case EXPERTISE_CHOICE -> b.deferred.add(new Deferred(key, g, s.label()));
                    case SAVING_THROW_CHOICE -> {
                        List<String> options = orAll(g.options(), Attribute.values()).stream()
                                .filter(o -> !b.saves.containsKey(Attribute.valueOf(o))).toList();
                        String label = orLabel(g, "Escolha " + g.count() + " resistência(s)");
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        selected.forEach(a -> b.saves.put(Attribute.valueOf(a), s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case SKILL_CHOICE -> {
                        if (Boolean.TRUE.equals(g.expertise())) {
                            b.deferred.add(new Deferred(key, g, s.label()));
                            break;
                        }
                        List<String> options = orAll(g.options(), SkillType.values()).stream()
                                .filter(o -> !b.skills.containsKey(SkillType.valueOf(o))).toList();
                        String label = orLabel(g, "Escolha " + g.count() + " perícia(s)");
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        selected.forEach(o -> b.skills.put(SkillType.valueOf(o), s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case FEATURE -> {
                        if (!g.hasOptions()) break;
                        // count > 1: escolhe várias opções ("Perturbações (A, B)").
                        int count = g.count() == null ? 1 : g.count();
                        String label = orLabel(g, g.name() + (count == 1 ? ": escolha uma opção" : ": escolha " + count + " opções"));
                        List<String> selected = choose(picked, g.options(), count, label, b.errors);
                        String name = selected.isEmpty() ? g.name() : g.name() + " (" + String.join(", ", selected) + ")";
                        Grant chosen = g.withName(name);
                        // Opção com usos próprios (ex.: Charme Sobrenatural = metade do mod. de Carisma).
                        if (selected.size() == 1 && g.optionUses() != null && g.optionUses().containsKey(selected.getFirst())) {
                            chosen = chosen.withUses(g.optionUses().get(selected.getFirst()));
                        }
                        if (!selected.isEmpty()) b.featureOptions.put(g.name(), selected);
                        // Opções que são Mistérios ("Água (Elemental)"): viram Mistérios do personagem.
                        if (MYSTERY.equals(g.value())) selected.forEach(o -> mysteryByName(o).ifPresent(b.mysteries::add));
                        b.features.add(new Sourced<>(chosen, s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, count, g.options(), selected, s.label(), null));
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
                        // Proficiências literais: "ARMOR:LIGHT" (armadura) e "WEAPON:Armas de fogo leves" (arma pelo nome).
                        kinds.stream().filter(k -> k.startsWith("ARMOR:") && !b.armorProficiencies.contains(k.substring(6))).forEach(options::add);
                        kinds.stream().filter(k -> k.startsWith("WEAPON:") && !b.weaponProficiencies.contains(k.substring(7))).forEach(options::add);
                        String label = orLabel(g, "Escolha " + g.count() + " proficiência(s)");
                        List<String> selected = choose(picked, options, g.count(), label, b.errors);
                        for (String o : selected) {
                            if (o.startsWith("SKILL:")) b.skills.put(SkillType.valueOf(o.substring(6)), s.label());
                            else if (o.startsWith("CRAFT:")) b.crafts.add(o.substring(6));
                            else if (o.startsWith("ARMOR:")) b.armorProficiencies.add(o.substring(6));
                            else if (o.startsWith("WEAPON:")) b.weaponProficiencies.add(o.substring(7));
                            else {
                                b.weaponProficiencies.add("Uma arma marcial à escolha");
                                b.features.add(new Sourced<>(Grant.feature(AbilityType.PASSIVE, "Proficiência em arma marcial",
                                        "Proficiência em uma arma marcial à escolha (combine qual com o mestre)."), s.label()));
                            }
                        }
                        b.choices.add(new ChoiceLine(key, g.type(), label, g.count(), options, selected, s.label(), null));
                    }
                    case ARMOR_CLASS -> {
                        // CA com atributo à escolha (Armadura Natural da Runinata): options = atributos.
                        if (!g.hasOptions()) break;
                        String label = orLabel(g, g.name() + ": escolha o atributo");
                        List<String> selected = choose(picked, g.options(), 1, label, b.errors);
                        b.armorRules.add(armorRule(g, selected.isEmpty() ? null : Attribute.valueOf(selected.getFirst())));
                        b.choices.add(new ChoiceLine(key, g.type(), label, 1, g.options(), selected, s.label(), null));
                    }
                    case SIZE_CHOICE -> {
                        // Tamanho fixo de outra fonte (ex.: traço Chaveirinho) vence a escolha.
                        if (b.sizeFixed) break;
                        String label = orLabel(g, "Escolha o tamanho");
                        List<String> selected = choose(picked, g.options(), 1, label, b.errors);
                        if (!selected.isEmpty()) b.size = CreatureSize.valueOf(selected.getFirst());
                        b.choices.add(new ChoiceLine(key, g.type(), label, 1, g.options(), selected, s.label(), null));
                    }
                    // Decidida no fim (spellChoices), quando os Mistérios já são conhecidos.
                    case SPELL_CHOICE -> b.spellChoices.add(new SpellChoice(key, g, s.label(), picked == null ? List.of() : picked));
                    case EQUIPMENT_CHOICE -> {
                        // Trocando pela riqueza inicial, as escolhas de equipamento somem.
                        if (b.wealth) break;
                        int count = g.count() == null ? 1 : g.count();
                        List<String> options = EquipmentRules.expand(catalog.equipment(), g.options());
                        String label = orLabel(g, "Equipamento: escolha " + (count == 1 ? "um" : count));
                        List<String> selected = choose(picked, options, count, label, b.errors);
                        selected.forEach(o -> addEquipment(b, o, s.label()));
                        b.choices.add(new ChoiceLine(key, g.type(), label, count, options, selected, s.label(), null));
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

        expertise(b, picks);
        b.features.addAll(b.traitFeatures);
        heritages(r, b);

        if (b.origin != null) b.baseSpeed = b.origin.speed() != null ? b.origin.speed()
                : catalog.baseSpeed() != null ? catalog.baseSpeed() : DEFAULT_SPEED_FEET;
        if (b.klass != null && catalog.equipment() != null && catalog.equipment().startingWealth() != null) {
            b.wealthFormula = catalog.equipment().startingWealth().get(b.klass.id());
        }
        if (b.wealth && b.wealthFormula == null && b.klass != null) b.errors.add("A classe não tem riqueza inicial cadastrada.");
        // O ouro da classe e do passado faz parte do equipamento ("algibeira contendo 10 PO"): com a riqueza inicial, não vem.
        if (!b.wealth && b.klass != null && b.klass.startingGold() != null) b.gold += b.klass.startingGold();
        if (!b.wealth && b.background != null && b.background.startingGold() != null) b.gold += b.background.startingGold();
        if (b.origin != null && b.origin.startingGold() != null) b.gold += b.origin.startingGold();

        for (Grant g : b.optionArmor) {
            List<String> chosen = b.featureOptions.get(g.armor().feature());
            if (chosen != null && chosen.contains(g.armor().featureOption())) b.armorRules.add(armorRule(g, null));
        }
        resourceChoices(b);
        spellChoices(b);
        multiclassChecks(b);

        if (blank(r.characterName())) b.errors.add("Dê um nome ao personagem.");
        if (r.age() == null || r.age() < 1) b.errors.add("Informe a idade (1 ou mais).");
        if (r.height() == null || r.height() <= 0) b.errors.add("Informe a altura em metros.");
        return b;
    }

    // ---------- Especialidade ----------

    // Por último, com todas as perícias já ganhas: "proficiência; caso já tenha, especialidade" (SKILL e SKILL_CHOICE
    // com expertise) e a escolha de especialidade entre as perícias que o personagem tem (EXPERTISE_CHOICE).
    private static void expertise(Build b, Map<String, List<String>> picks) {
        for (Deferred d : b.deferred) {
            Grant g = d.grant();
            switch (g.type()) {
                case SKILL -> gainOrExpert(b, g.skill(), d.source());
                case SKILL_CHOICE -> {
                    // As que ele já tem continuam nas opções: escolhê-las dá especialidade.
                    List<String> options = orAll(g.options(), SkillType.values()).stream()
                            .filter(o -> !b.expertise.contains(SkillType.valueOf(o))).toList();
                    String label = orLabel(g, "Escolha " + g.count() + " perícia(s) (especialidade se já tiver)");
                    List<String> selected = choose(picks.get(d.key()), options, g.count(), label, b.errors);
                    selected.forEach(o -> gainOrExpert(b, SkillType.valueOf(o), d.source()));
                    b.choices.add(new ChoiceLine(d.key(), g.type(), label, g.count(), options, selected, d.source(), null));
                }
                case EXPERTISE_CHOICE -> {
                    if ("WITH_CRAFTS".equals(g.value())) {
                        // Perícias ou ofícios que ele tem: opções "SKILL:..." e "CRAFT:..." (Especialização do Mercurial).
                        List<String> options = new ArrayList<>();
                        orAll(g.options(), SkillType.values()).stream()
                                .filter(o -> b.skills.containsKey(SkillType.valueOf(o)) && !b.expertise.contains(SkillType.valueOf(o)))
                                .forEach(o -> options.add("SKILL:" + o));
                        b.crafts.stream().filter(k -> !b.craftExpertise.contains(k)).forEach(k -> options.add("CRAFT:" + k));
                        String label = orLabel(g, "Escolha " + g.count() + " perícia(s) ou ofício(s) para especialidade");
                        b.choices.add(optionalChoice(d.key(), g, label, options, picks.get(d.key()), d.source(), b,
                                "Escolha primeiro as perícias e os ofícios do personagem.",
                                o -> {
                                    if (o.startsWith("SKILL:")) b.expertise.add(SkillType.valueOf(o.substring(6)));
                                    else b.craftExpertise.add(o.substring(6));
                                }));
                        break;
                    }
                    List<String> options = orAll(g.options(), SkillType.values()).stream()
                            .filter(o -> b.skills.containsKey(SkillType.valueOf(o)) && !b.expertise.contains(SkillType.valueOf(o)))
                            .toList();
                    String label = orLabel(g, "Escolha " + g.count() + " perícia(s) para especialidade");
                    b.choices.add(optionalChoice(d.key(), g, label, options, picks.get(d.key()), d.source(), b,
                            "Escolha primeiro as perícias em que o personagem é proficiente.",
                            o -> b.expertise.add(SkillType.valueOf(o))));
                }
                default -> { }
            }
        }
    }

    private static void gainOrExpert(Build b, SkillType skill, String source) {
        if (b.skills.containsKey(skill)) b.expertise.add(skill);
        else b.skills.put(skill, source);
    }

    private record Deferred(String key, Grant grant, String source) {}

    // ---------- Classe de Armadura ----------

    // Opção de defesa (ARMOR_CLASS). chosen: atributo escolhido quando a concessão tem options.
    static ArmorRule armorRule(Grant g, Attribute chosen) {
        ArmorFormula f = g.armor() == null ? new ArmorFormula(null, null, null, null, null, null, null, null, null, null, null, null) : g.armor();
        ArmorRule r = new ArmorRule();
        r.setName(ArmorClassCalculator.withAttribute(g.name() != null ? g.name() : g.label(), chosen));
        r.setBase(f.base());
        r.setDex(f.dexOrTrue());
        r.setDexMax(f.dexMax());
        r.setAttribute(chosen != null ? chosen : f.attribute());
        r.setSecondAttribute(f.secondAttribute());
        r.setProficiency(Boolean.TRUE.equals(f.proficiency()));
        r.setReduction(f.reduction());
        r.setBlocksArmor(Boolean.TRUE.equals(f.blocksArmor()));
        r.setRequiresArmor(f.requiresArmor());
        return r;
    }

    // Bônus de CA (AC_BONUS): amount e/ou o bônus de proficiência (usesFormula PROFICIENCY).
    static ArmorRule armorBonus(Grant g) {
        return armorBonus(g, CREATION_LEVEL);
    }

    static ArmorRule armorBonus(Grant g, int level) {
        ArmorFormula f = g.armor();
        ArmorRule r = new ArmorRule();
        r.setName(g.name() != null ? g.name() : g.label() != null ? g.label() : "Bônus de CA");
        r.setBonus(true);
        r.setAmount(valueAt(g, g.amount(), level));
        r.setProficiency(g.usesFormula() == UsesFormula.PROFICIENCY || (f != null && Boolean.TRUE.equals(f.proficiency())));
        r.setUnarmoredOnly(f != null && Boolean.TRUE.equals(f.unarmoredOnly()));
        r.setBlocksArmor(f != null && Boolean.TRUE.equals(f.blocksArmor()));
        return r;
    }

    // ---------- Traços (Runinata) ----------

    // A Runinata monta a origem com traços: o modo (combinado com o mestre) dá Traços Menores e Maiores;
    // desvantagens e a conversão de até um traço de cada tipo dão pontos de Origem, que compram mais traços
    // (os Superiores só assim). A conversão é escolhida sozinha: a que cobre os traços escolhidos com menos sobra.
    private void traits(CreationRequest r, Build b) {
        RuleTraits system = rules.catalog().traits();
        if (system == null) {
            b.errors.add("O sistema de traços não está cadastrado.");
            return;
        }
        // Modo travado pelo mestre vence o que o jogador mandou.
        String locked = settings.lockedTraitBudget();
        RuleTraits.Budget budget = pick(locked != null ? locked : r.traitBudget(),
                id -> system.budgetsOrEmpty().stream().filter(x -> x.id().equalsIgnoreCase(id)).findFirst(),
                "Escolha o modo de traços combinado com o mestre.", "Modo de traços desconhecido.", b.errors);
        Map<String, Picked> traits = collectTraits(r.traits(), rules::trait, "Traço desconhecido.", b);
        Map<String, Picked> drawbacks = collectTraits(r.drawbacks(), rules::drawback, "Desvantagem desconhecida.", b);

        int minor = 0, major = 0, superior = 0;
        double drawbackPoints = 0;
        for (Picked p : traits.values()) {
            RuleTrait t = p.trait();
            if (!t.requiresOrEmpty().isEmpty() && t.requiresOrEmpty().stream().noneMatch(traits::containsKey)) {
                b.errors.add("O traço " + t.name() + " precisa de: " + traitNames(t.requiresOrEmpty()) + ".");
            }
            int n = p.details().size();
            switch (t.tier()) {
                case "MINOR" -> minor += n;
                case "MAJOR" -> major += n;
                default -> superior += n;
            }
            if (Boolean.TRUE.equals(t.background())) b.traitBackground = true;
        }
        for (Picked p : drawbacks.values()) drawbackPoints += p.trait().points() * p.details().size();

        for (Map.Entry<String, Picked> e : traits.entrySet()) addTraitSources(e.getValue(), "trait", "Traço", "TRAIT", b);
        for (Map.Entry<String, Picked> e : drawbacks.entrySet()) addTraitSources(e.getValue(), "drawback", "Desvantagem", "DRAWBACK", b);

        for (RuleTrait t : system.traitsOrEmpty()) {
            int times = traits.containsKey(t.id()) ? traits.get(t.id()).details().size() : 0;
            String reason = null;
            if (!t.requiresOrEmpty().isEmpty() && t.requiresOrEmpty().stream().noneMatch(traits::containsKey)) {
                reason = "precisa de " + traitNames(t.requiresOrEmpty());
            } else if (times >= t.maxTimesOrOne()) {
                reason = t.maxTimesOrOne() == 1 ? "já escolhido" : "já escolhido " + times + " vezes (máximo)";
            }
            b.traitOptions.add(new TraitStatus(t.id(), reason == null, reason, times));
        }
        for (RuleTrait t : system.drawbacksOrEmpty()) {
            int times = drawbacks.containsKey(t.id()) ? drawbacks.get(t.id()).details().size() : 0;
            String reason = times >= t.maxTimesOrOne() ? (t.maxTimesOrOne() == 1 ? "já escolhida" : "já escolhida " + times + " vezes (máximo)") : null;
            b.traitOptions.add(new TraitStatus(t.id(), reason == null, reason, times));
        }

        if (budget == null) return;
        int budgetMinor = budget.minor(), budgetMajor = budget.major();
        int[] best = null;
        double bestWaste = Double.MAX_VALUE;
        for (int cm = 0; cm <= Math.min(1, budgetMinor); cm++) {
            for (int cj = 0; cj <= Math.min(1, budgetMajor); cj++) {
                int slotsMinor = budgetMinor - cm, slotsMajor = budgetMajor - cj;
                double points = drawbackPoints + cm * system.conversionOf("MINOR") + cj * system.conversionOf("MAJOR");
                int cost = traitCost(system, minor - slotsMinor, major - slotsMajor, superior);
                if (cost > points) continue;
                double waste = Math.max(0, slotsMinor - minor) + Math.max(0, slotsMajor - major) + Math.floor(points - cost);
                if (waste < bestWaste) {
                    bestWaste = waste;
                    best = new int[] {cm, cj};
                }
            }
        }
        int cm = best == null ? 0 : best[0], cj = best == null ? 0 : best[1];
        int slotsMinor = budgetMinor - cm, slotsMajor = budgetMajor - cj;
        double points = drawbackPoints + cm * system.conversionOf("MINOR") + cj * system.conversionOf("MAJOR");
        int cost = traitCost(system, minor - slotsMinor, major - slotsMajor, superior);
        b.traitBudget = new TraitBudgetStatus(budget.id(), slotsMinor, slotsMajor, Math.min(minor, slotsMinor),
                Math.min(major, slotsMajor), cm == 1, cj == 1, drawbackPoints, points, cost, locked != null);
        if (best == null) {
            b.errors.add("Os traços escolhidos passam do que o modo " + budget.name() + " e as desvantagens permitem.");
        } else if (bestWaste > 0) {
            b.errors.add("Ainda sobram traços ou pontos de Origem para escolher.");
        }
    }

    // Pontos de Origem para os traços além dos do modo: menores e maiores excedentes e todos os superiores.
    private static int traitCost(RuleTraits system, int extraMinor, int extraMajor, int superior) {
        return Math.max(0, extraMinor) * system.costOf("MINOR") + Math.max(0, extraMajor) * system.costOf("MAJOR")
                + superior * system.costOf("SUPERIOR");
    }

    // Junta as escolhas por id (na ordem), com a resposta de cada vez; confere máximo e resposta obrigatória.
    private Map<String, Picked> collectTraits(List<TraitPick> picks, Function<String, Optional<RuleTrait>> find, String unknown, Build b) {
        Map<String, Picked> out = new LinkedHashMap<>();
        for (TraitPick pick : picks == null ? List.<TraitPick>of() : picks) {
            if (pick == null) continue;
            Optional<RuleTrait> found = find.apply(pick.id());
            if (found.isEmpty()) {
                b.errors.add(unknown);
                continue;
            }
            RuleTrait t = found.get();
            out.computeIfAbsent(t.id(), k -> new Picked(t, new ArrayList<>()))
                    .details().add(blank(pick.detail()) ? null : pick.detail().trim());
        }
        for (Picked p : out.values()) {
            RuleTrait t = p.trait();
            if (p.details().size() > t.maxTimesOrOne()) {
                b.errors.add(t.maxTimesOrOne() == 1 ? t.name() + " só pode ser escolhido uma vez."
                        : t.name() + " pode ser escolhido no máximo " + t.maxTimesOrOne() + " vezes.");
            }
            if (t.detail() != null && p.details().stream().anyMatch(d -> d == null)) {
                b.errors.add("Responda em " + t.name() + ": " + t.detail());
            }
        }
        return out;
    }

    // Cada escolha vira uma fonte de concessões ("Traço: Garras"); o texto vira uma passiva (uma por traço).
    private static void addTraitSources(Picked p, String key, String label, String kind, Build b) {
        RuleTrait t = p.trait();
        for (int n = 0; n < p.details().size(); n++) {
            List<Grant> grants = t.grantsOrEmpty();
            // Deslocamento que cresce a cada escolha (Aquático: 15, 15, 10…): a n-ésima escolha usa o n-ésimo passo.
            if (t.speedSteps() != null && !t.speedSteps().isEmpty()) {
                Double step = t.speedSteps().get(Math.min(n, t.speedSteps().size() - 1));
                grants = grants.stream().map(g -> g.type() == GrantType.SPEED ? g.withFeet(step) : g).toList();
            }
            b.traitSources.add(new Source(key + ":" + t.id() + ":" + n, label + ": " + t.name(), grants));
        }
        List<String> details = p.details().stream().filter(d -> d != null).toList();
        int times = p.details().size();
        b.traitLines.add(new TraitLine(t.id(), t.name(), kind, t.tier(), details, times));
        if (Boolean.TRUE.equals(t.silent())) return;
        String name = t.name() + (details.isEmpty() ? "" : " (" + String.join(", ", details) + ")") + (times > 1 ? " (" + times + "×)" : "");
        b.traitFeatures.add(new Sourced<>(Grant.feature(AbilityType.PASSIVE, name, t.description()), label));
    }

    private String traitNames(List<String> ids) {
        return String.join(" ou ", ids.stream().map(id -> rules.trait(id).map(RuleTrait::name).orElse(id)).toList());
    }

    private record Picked(RuleTrait trait, List<String> details) {}

    // ---------- Recursos de classe (Capítulo 5) ----------

    private static final Map<String, String> RESOURCE_KINDS = Map.ofEntries(
            Map.entry("IRA", "Ira"), Map.entry("SUTRA", "Sutra"), Map.entry("VEL", "Vel"), Map.entry("TECNICA", "Técnica de Combate"),
            Map.entry("INVOCACAO", "Invocação"), Map.entry("GRANDE_ESPIRITO", "Grande Espírito"),
            Map.entry("ASPECTO_TERRESTRE", "Aspecto Terrestre"), Map.entry("ASPECTO_AQUATICO", "Aspecto Aquático"),
            Map.entry("ASPECTO_ALADO", "Aspecto Alado"), Map.entry("RUNA", "Runa"), Map.entry("APRIMORAMENTO", "Aprimoramento"));

    static String resourceKindLabel(String kind) {
        return RESOURCE_KINDS.getOrDefault(kind, kind);
    }

    // ---------- Subida de nível ----------

    // Níveis do personagem acima do 20º não existem.
    static final int MAX_LEVEL = 20;
    // Níveis do personagem que dão 1 ponto de Herança (de Origem ou Geral).
    static final Set<Integer> HERITAGE_LEVELS = Set.of(5, 9, 13, 17);
    // O que a classe NÃO dá quando entra por multiclasse (proficiências, perícias, salvaguardas, equipamento e ouro).
    private static final Set<GrantType> NOT_ON_MULTICLASS = Set.of(GrantType.SAVING_THROW, GrantType.SAVING_THROW_CHOICE,
            GrantType.SKILL, GrantType.SKILL_CHOICE, GrantType.ARMOR_PROFICIENCY, GrantType.WEAPON_PROFICIENCY, GrantType.CRAFT,
            GrantType.CRAFT_CHOICE, GrantType.EQUIPMENT, GrantType.EQUIPMENT_CHOICE, GrantType.GOLD, GrantType.LANGUAGE,
            GrantType.LANGUAGE_CHOICE);

    // Cada nível ganho vira fontes "level:N:...": os ganhos daquele nível da classe e da subclasse (ou, numa classe
    // nova, o 1º nível dela sem as proficiências iniciais + as de multiclasse), os ganhos da origem e da linhagem no
    // nível do personagem e o ponto de Herança dos níveis 5, 9, 13 e 17. As escolhas do nível entram nos picks.
    private void levelSources(CreationRequest r, Build b, List<Source> sources, Map<String, List<String>> picks) {
        List<LevelPick> levels = r.levelsOrEmpty();
        if (levels.isEmpty()) return;
        if (b.klass == null) return;
        if (1 + levels.size() > MAX_LEVEL) b.errors.add("O nível máximo é o " + MAX_LEVEL + "º.");
        for (int i = 0; i < levels.size(); i++) {
            LevelPick lp = levels.get(i);
            int charLevel = i + 2;
            String prefix = "level:" + charLevel + ":";
            if (lp == null) {
                b.errors.add("Falta o " + charLevel + "º nível.");
                continue;
            }
            if (lp.choices() != null) lp.choices().forEach(picks::put);
            RuleClass k = blank(lp.classId()) ? b.klass : rules.characterClass(lp.classId()).orElse(null);
            if (k == null) {
                b.errors.add(charLevel + "º nível: classe desconhecida.");
                continue;
            }
            int n = b.classLevels.merge(k.id(), 1, Integer::sum);
            b.classById.put(k.id(), k);
            String classLabel = "Classe: " + k.name() + " (" + n + "º nível)";
            b.sourceClass.put(classLabel, k.id());
            if (n == 1) {
                // Classe nova (multiclasse): 1º nível sem o que é só de quem começa nela, mais as proficiências da tabela.
                b.multiclassed.add(k);
                List<Grant> grants = new ArrayList<>(k.grantsOrEmpty().stream().filter(g -> !NOT_ON_MULTICLASS.contains(g.type())).toList());
                if (k.multiclass() != null) grants.addAll(k.multiclass().grantsOrEmpty());
                sources.add(new Source(prefix + "class:" + k.id(), classLabel, grants));
                if (!k.subclassesOrEmpty().isEmpty()) {
                    RuleLineage sub = k.subclassesOrEmpty().stream().filter(x -> x.id().equalsIgnoreCase(String.valueOf(lp.subclassId()))).findFirst().orElse(null);
                    if (sub == null) {
                        b.errors.add(charLevel + "º nível: escolha " + subclassLabel(k) + " de " + k.name() + ".");
                    } else {
                        b.subclassByClass.put(k.id(), sub);
                        String subLabel = subclassLabel(k) + ": " + sub.name();
                        b.sourceClass.put(subLabel, k.id());
                        sources.add(new Source(prefix + "subclass:" + sub.id(), subLabel,
                                sub.grantsOrEmpty().stream().filter(g -> !NOT_ON_MULTICLASS.contains(g.type())).toList()));
                    }
                }
            } else {
                k.levelsOrEmpty().stream().filter(l -> l.level() != null && l.level() == n).findFirst()
                        .ifPresent(l -> sources.add(new Source(prefix + "class:" + k.id(), classLabel, l.grants() == null ? List.of() : l.grants())));
                RuleLineage sub = b.subclassByClass.get(k.id());
                if (sub != null) {
                    String subLabel = subclassLabel(k) + ": " + sub.name() + " (" + n + "º nível)";
                    b.sourceClass.put(subLabel, k.id());
                    sub.levelsOrEmpty().stream().filter(l -> l.level() != null && l.level() == n).findFirst()
                            .ifPresent(l -> sources.add(new Source(prefix + "subclass:" + sub.id(), subLabel, l.grants() == null ? List.of() : l.grants())));
                }
            }
            if (b.origin != null) b.origin.levelsOrEmpty().stream().filter(l -> l.level() != null && l.level() == charLevel).findFirst()
                    .ifPresent(l -> sources.add(new Source(prefix + "origin:" + b.origin.id(), "Origem: " + b.origin.name() + " (" + charLevel + "º nível)",
                            l.grants() == null ? List.of() : l.grants())));
            if (b.lineage != null) b.lineage.levelsOrEmpty().stream().filter(l -> l.level() != null && l.level() == charLevel).findFirst()
                    .ifPresent(l -> sources.add(new Source(prefix + "lineage:" + b.lineage.id(), "Linhagem: " + b.lineage.name() + " (" + charLevel + "º nível)",
                            l.grants() == null ? List.of() : l.grants())));
            if (HERITAGE_LEVELS.contains(charLevel)) {
                sources.add(new Source(prefix + "heritage", "Herança do " + charLevel + "º nível",
                        List.of(new Grant(GrantType.HERITAGE_POINTS, null, 1, null, null, null, "ORIGIN", null, null, null, null,
                                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                null, null, null, null, null, null, null))));
            }
            // Dado de vida: rolado no app ou na mesa; vale de 1 até o lado do dado da classe do nível.
            int die = k.hitDie() == null ? 0 : k.hitDie();
            if (lp.hpRoll() == null || lp.hpRoll() < 1 || lp.hpRoll() > die) {
                b.errors.add(charLevel + "º nível: informe o dado de vida (1d" + die + ").");
                b.hpRolls.add(0);
            } else {
                b.hpRolls.add(lp.hpRoll());
            }
        }
    }

    // Multiclasse: o pré-requisito vale para cada classe nova e para as que o personagem já tinha (com os atributos
    // finais). Nenhum atributo passa de 20.
    private void multiclassChecks(Build b) {
        if (!b.multiclassed.isEmpty()) {
            for (RuleClass k : b.classById.values()) {
                String reason = multiclassBlock(k, b);
                if (reason != null) b.errors.add("Multiclasse com " + k.name() + ": " + reason + ".");
            }
        }
        for (Attribute a : Attribute.values()) {
            if (b.total(a) > 20) b.errors.add(a.name() + " passa de 20.");
        }
    }

    static String multiclassBlock(RuleClass k, Build b) {
        RuleClass.Multiclass m = k.multiclass();
        if (m == null) return null;
        String reason = "pré-requisito " + (m.prerequisite() == null ? "não atendido" : m.prerequisite());
        if (m.attributes() != null && m.attributes().entrySet().stream().anyMatch(e -> b.total(e.getKey()) < e.getValue())) return reason;
        if (m.anyAttributes() != null && !m.anyAttributes().isEmpty()
                && m.anyAttributes().entrySet().stream().noneMatch(e -> b.total(e.getKey()) >= e.getValue())) return reason;
        if (m.anotherAttribute() != null) {
            Set<Attribute> used = m.attributes() == null ? Set.of() : m.attributes().keySet();
            boolean other = Arrays.stream(Attribute.values()).anyMatch(a -> !used.contains(a) && b.total(a) >= m.anotherAttribute());
            if (!other) return reason;
        }
        return null;
    }

    // ---------- Magias ----------

    // Valor de FEATURE.value cujas opções são Mistérios.
    static final String MYSTERY = "MYSTERY";

    // "Água (Elemental)", "Infernal" → id do Mistério, pelo nome (sem acento nem maiúscula; Infernal = Inferno).
    private Optional<String> mysteryByName(String option) {
        RuleMagic magic = rules.catalog().magic();
        if (magic == null) return Optional.empty();
        String name = normalize(option.replaceAll("\\s*\\(.*\\)$", "")).replace("infernal", "inferno");
        return magic.mysteriesOrEmpty().stream().filter(m -> normalize(m.name()).equals(name)).map(RuleMagic.Mystery::id).findFirst();
    }

    private static String normalize(String s) {
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase().trim();
    }

    // Magias conhecidas: as fixas (SPELL) e as escolhas (SPELL_CHOICE), com as opções da lista da classe e/ou dos Mistérios
    // do personagem (o Elemental Geral vem com o primeiro Mistério Elemental). Uma magia escolhida não aparece de novo.
    // Cada magia vira uma habilidade SPELL com a fonte da escolha.
    private void spellChoices(Build b) {
        RuleMagic magic = rules.catalog().magic();
        if (magic == null) return;
        Set<String> mysteries = new LinkedHashSet<>(b.mysteries);
        boolean elemental = magic.mysteriesOrEmpty().stream().anyMatch(m -> "ELEMENTAL".equals(m.source()) && mysteries.contains(m.id()));
        if (elemental) mysteries.add("elemental-geral");
        b.mysteries.clear();
        b.mysteries.addAll(mysteries);
        Map<String, RuleMagic.Spell> byId = new LinkedHashMap<>();
        magic.spellsOrEmpty().forEach(sp -> byId.put(sp.id(), sp));
        Set<String> taken = new LinkedHashSet<>(b.fixedSpells.keySet());
        b.fixedSpells.forEach((id, source) -> {
            RuleMagic.Spell sp = byId.get(id);
            if (sp != null) b.features.add(new Sourced<>(Grant.spell(sp), source));
        });
        for (SpellChoice c : b.spellChoices) {
            Grant g = c.grant();
            int level = g.spellLevel() == null ? 0 : g.spellLevel();
            String from = g.value() == null ? "CLASS_OR_MYSTERIES" : g.value();
            // Lista da classe de onde vem a escolha (multiclasse: a da outra classe).
            String classId = b.sourceClass.getOrDefault(c.source(), b.klass == null ? null : b.klass.id());
            List<String> options = new ArrayList<>();
            Map<String, String> names = new LinkedHashMap<>();
            for (RuleMagic.Spell sp : magic.spellsOrEmpty()) {
                if (sp.level() == null || (level == 0 ? sp.level() != 0 : sp.level() < 1 || sp.level() > level)) continue;
                boolean fromClass = !"MYSTERIES".equals(from) && classId != null && sp.classesOrEmpty().contains(classId);
                boolean fromMystery = !"CLASS".equals(from) && sp.mysteriesOrEmpty().stream().anyMatch(mysteries::contains);
                if (!fromClass && !fromMystery) continue;
                if (taken.contains(sp.id()) && !c.picked().contains(sp.id())) continue;
                options.add(sp.id());
                names.put(sp.id(), sp.name() + (sp.level() == 0 ? "" : " (" + sp.level() + "º)"));
            }
            int count = g.count() == null ? 1 : g.count();
            String label = orLabel(g, level == 0 ? "Truques: escolha " + count : "Magias até o " + level + "º nível: escolha " + count);
            String note = null;
            List<String> selected;
            if (options.isEmpty()) {
                // Sem Mistério ainda (Arcanista) ou sem lista: avisa, sem bloquear com "faltam escolhas".
                note = "MYSTERIES".equals(from) ? "Escolha um Mistério para ver as magias." : "Nenhuma magia disponível nesta lista.";
                selected = List.of();
                if (!c.picked().isEmpty()) b.errors.add("Opção inválida em \"" + label + "\".");
            } else {
                selected = choose(c.picked(), options, count, label, b.errors);
            }
            taken.addAll(selected);
            selected.forEach(id -> b.features.add(new Sourced<>(Grant.spell(byId.get(id)), c.source())));
            b.choices.add(new ChoiceLine(c.key(), g.type(), label, count, options, selected, c.source(), note, names));
        }
    }

    // Itens de uma opção de equipamento ("besta-leve+virotes-de-besta") na lista do equipamento inicial.
    private void addEquipment(Build b, String option, String source) {
        for (EquipmentRules.Entry e : EquipmentRules.parse(option)) {
            String name = EquipmentRules.item(rules.catalog().equipment(), e.item()).map(RuleItem::name).orElse(e.item());
            b.equipment.add(new EquipmentLine(e.item(), name, e.quantity(), source));
        }
    }

    // Os recursos escolhidos (RESOURCE_CHOICE) viram fontes como as outras, antes das passadas: as concessões
    // deles (CA do Sutra do Vento, +2 de Força da Potência do Búfalo, escolhas internas...) seguem o fluxo normal.
    // A lista cresce enquanto percorre: um recurso pode trazer outra escolha (Combatente Monástico → Sutra).
    private void resourceSources(List<Source> sources, Map<String, List<String>> picks, Build b) {
        for (int s = 0; s < sources.size(); s++) {
            Source src = sources.get(s);
            List<Grant> grants = src.grants();
            for (int i = 0; i < grants.size(); i++) {
                Grant g = grants.get(i);
                if (g.type() != GrantType.RESOURCE_CHOICE) continue;
                String key = src.key() + ":" + i;
                List<String> picked = List.copyOf(new LinkedHashSet<>(picks.getOrDefault(key, List.of())));
                b.resourceChoices.add(new ResourceChoice(key, g, src.label(), picked));
                for (String id : picked) {
                    Optional<RuleResource> found = rules.resource(id);
                    if (found.isEmpty() || !found.get().kind().equals(g.value())) continue;
                    RuleResource res = found.get();
                    // Repetível (o aumento de atributo de cada Aprimoramento): uma fonte por escolha, com a chave dela.
                    // Escolhido num nível ganho: a chave também leva o nível, para as escolhas internas serem
                    // "level:N:..." como as outras daquele nível.
                    boolean keyed = res.repeats() || key.startsWith("level:") || key.contains("@level:");
                    if (!b.resourceIds.add(res.id()) && !res.repeats()) continue;
                    sources.add(new Source("resource:" + res.id() + (keyed ? "@" + key : ""), resourceKindLabel(res.kind()) + ": " + res.name(), resourceGrants(res)));
                }
            }
        }
    }

    // A habilidade com o texto do recurso (pré-requisito, execução e componentes no topo) + as concessões dele.
    static List<Grant> resourceGrants(RuleResource res) {
        StringBuilder text = new StringBuilder();
        if (res.prerequisite() != null) text.append("Pré-requisito: ").append(res.prerequisite()).append('\n');
        if (res.execution() != null) text.append("Execução: ").append(res.execution()).append('\n');
        if (res.components() != null) text.append("Componentes: ").append(res.components()).append('\n');
        if (res.cost() != null) text.append("Vel: ").append("◆".repeat(res.cost())).append('\n');
        if (!text.isEmpty()) text.append('\n');
        text.append(res.description() == null ? "" : res.description());
        AbilityType type = res.execution() != null || res.uses() != null ? AbilityType.ABILITY : AbilityType.PASSIVE;
        List<Grant> grants = new ArrayList<>();
        Grant feature = Grant.feature(type, res.name(), text.toString());
        grants.add(res.uses() == null ? feature : feature.withUses(res.uses()));
        grants.addAll(res.grantsOrEmpty());
        return grants;
    }

    // Depois de tudo (atributos, heranças, opções): o que cada escolha aceita, o que foi escolhido e os erros.
    private void resourceChoices(Build b) {
        for (ResourceChoice c : b.resourceChoices) {
            Grant g = c.grant();
            boolean vel = "VEL".equals(g.value());
            List<RuleResource> pool = rules.resources(g.value()).stream()
                    .filter(r -> !g.hasOptions() || r.groupsOrEmpty().stream().anyMatch(g.options()::contains))
                    .toList();
            List<String> options = new ArrayList<>();
            List<String> selected = new ArrayList<>();
            int locked = 0;
            for (RuleResource r : pool) {
                boolean mine = c.picked().contains(r.id());
                // Escolhido em outra escolha: não aparece de novo (a não ser que possa repetir).
                if (!mine && !r.repeats() && b.resourceIds.contains(r.id())) continue;
                String reason = resourceBlock(r, b, mine);
                if (reason == null) options.add(r.id());
                else locked++;
                if (mine) {
                    if (reason == null) selected.add(r.id());
                    else b.errors.add(r.name() + ": " + reason + ".");
                }
            }
            for (String id : c.picked()) {
                if (pool.stream().noneMatch(r -> r.id().equals(id))) b.errors.add("Opção inválida em \"" + resourceLabel(g) + "\".");
            }
            int count = vel ? (g.amount() == null ? 0 : g.amount()) : (g.count() == null ? 1 : g.count());
            if (vel) {
                int used = selected.stream().mapToInt(id -> rules.resource(id).map(RuleResource::costOrOne).orElse(1)).sum();
                if (used > count) b.errors.add("Vel: os escolhidos ocupam " + used + " pontos, mas há " + count + ".");
            } else if (selected.size() > count) {
                b.errors.add("Escolha só " + count + " em \"" + resourceLabel(g) + "\".");
            } else if (selected.size() < count && options.size() > selected.size()) {
                b.errors.add("Faltam escolhas: " + resourceLabel(g) + ".");
            }
            String note = locked == 0 ? null
                    : locked == 1 ? "1 opção ainda bloqueada por pré-requisito." : locked + " opções ainda bloqueadas por pré-requisito.";
            if (options.isEmpty() && !vel) note = "Nenhuma opção disponível ainda: confira os pré-requisitos com o mestre.";
            b.choices.add(new ChoiceLine(c.key(), g.type(), resourceLabel(g), count, options, List.copyOf(selected), c.source(), note));
        }
        inactivateKi(b);
    }

    // Habilidade com a reserva de Ki da classe (Bodisatva, Combatente Monástico).
    static final String KI = "Ki";

    private static Optional<Sourced<Grant>> kiFeature(Build b) {
        return b.features.stream().filter(f -> KI.equals(f.value().name())).findFirst();
    }

    // Pontos de Ki do personagem na criação (0 sem a habilidade Ki).
    private static int kiTotal(Build b) {
        return kiFeature(b).map(f -> usesFor(f.value(), b.proficiency(), b.scale(f.source()), b.roundUp, b::modifier))
                .map(n -> n == null ? 0 : n).orElse(0);
    }

    // Os Vel com "N pontos de Ki" inativam esses pontos: saem do total de Ki (em todos os níveis da tabela).
    private void inactivateKi(Build b) {
        int inactive = b.resourceIds.stream().map(rules::resource).flatMap(Optional::stream)
                .mapToInt(r -> r.ki() == null ? 0 : r.ki()).sum();
        if (inactive == 0) return;
        Optional<Sourced<Grant>> ki = kiFeature(b);
        int total = kiTotal(b);
        if (ki.isEmpty() || total < inactive) {
            b.errors.add("Os Vel escolhidos inativam " + inactive + " ponto(s) de Ki, mas o personagem tem " + total + ".");
            return;
        }
        Grant g = ki.get().value();
        if (g.usesByLevel() == null || g.usesByLevel().isEmpty()) return;
        Map<String, Integer> table = new LinkedHashMap<>();
        g.usesByLevel().forEach((lv, n) -> table.put(lv, n == null ? null : Math.max(0, n - inactive)));
        Grant reduced = g.withUsesByLevel(table, g.description() + "\n\nKi inativado pelos Vel: " + inactive + " ponto(s).");
        b.features.set(b.features.indexOf(ki.get()), new Sourced<>(reduced, ki.get().source()));
    }

    static String resourceLabel(Grant g) {
        if (g.label() != null) return g.label();
        if ("VEL".equals(g.value())) return "Vel (opcional, até " + g.amount() + " ◆)";
        int count = g.count() == null ? 1 : g.count();
        return resourceKindLabel(g.value()) + (count == 1 ? ": escolha um" : ": escolha " + count);
    }

    // Por que o recurso não pode ser escolhido agora (null = pode). Na criação o personagem é de 1º nível.
    private static String resourceBlock(RuleResource r, Build b, boolean mine) {
        String pre = "pré-requisito: " + (r.prerequisite() == null ? "não atendido" : r.prerequisite());
        // Vel que inativa Ki: o personagem precisa ter esse Ki.
        if (r.ki() != null && r.ki() > kiTotal(b)) return pre;
        RuleResource.Requirements q = r.requires();
        if (q == null) return null;
        if (q.level() != null && q.level() > b.level) return "a partir do " + q.level() + "º nível";
        // Sem contar o que o próprio recurso dá (Potência do Búfalo: +2 de Força não paga a Força 15 dele).
        ToIntFunction<Attribute> value = a -> b.total(a) - (mine ? r.grantsOrEmpty().stream()
                .filter(x -> x.type() == GrantType.ATTRIBUTE && x.attribute() == a).mapToInt(x -> x.amount() == null ? 0 : x.amount()).sum() : 0);
        if (q.attributes() != null && q.attributes().entrySet().stream().anyMatch(e -> value.applyAsInt(e.getKey()) < e.getValue())) return pre;
        if (q.anyAttributes() != null && !q.anyAttributes().isEmpty()
                && q.anyAttributes().entrySet().stream().noneMatch(e -> value.applyAsInt(e.getKey()) >= e.getValue())) return pre;
        // Classe (e nível nela, "Caçador 8"): qualquer uma das classes do personagem; subclasse de qualquer classe.
        if (q.classes() != null && !q.classes().isEmpty()) {
            int need = q.classLevel() == null ? 1 : q.classLevel();
            boolean has = b.classLevels.isEmpty()
                    ? b.klass != null && need <= 1 && q.classes().stream().anyMatch(x -> x.equalsIgnoreCase(b.klass.id()))
                    : b.classLevels.entrySet().stream().anyMatch(e -> e.getValue() >= need
                            && q.classes().stream().anyMatch(x -> x.equalsIgnoreCase(e.getKey())));
            if (!has) return pre;
        }
        if (q.subclasses() != null && !q.subclasses().isEmpty() && b.subclassByClass.values().stream()
                .noneMatch(s -> q.subclasses().stream().anyMatch(x -> x.equalsIgnoreCase(s.id())))
                && (b.subclass == null || q.subclasses().stream().noneMatch(x -> x.equalsIgnoreCase(b.subclass.id())))) return pre;
        if (q.origins() != null && !q.origins().isEmpty()
                && (b.origin == null || q.origins().stream().noneMatch(x -> x.equalsIgnoreCase(b.origin.id())))) return pre;
        if (q.lineages() != null && !q.lineages().isEmpty()
                && (b.lineage == null || q.lineages().stream().noneMatch(x -> x.equalsIgnoreCase(b.lineage.id())))) return pre;
        if (q.regions() != null && !q.regions().isEmpty()
                && (b.region == null || q.regions().stream().noneMatch(x -> x.equalsIgnoreCase(b.region.id())))) return pre;
        if (q.skills() != null && q.skills().stream().anyMatch(x -> !b.skills.containsKey(SkillType.valueOf(x)))) return pre;
        if (q.heritages() != null && !q.heritages().isEmpty()
                && b.heritages.stream().noneMatch(h -> q.heritages().stream().anyMatch(x -> x.equalsIgnoreCase(h.id())))) return pre;
        if (q.resources() != null && q.resources().stream().anyMatch(x -> !b.resourceIds.contains(x))) return pre;
        if (q.weapons() != null && !q.weapons().isEmpty()
                && b.weaponProficiencies.stream().noneMatch(w -> q.weapons().stream().anyMatch(w::equalsIgnoreCase))) return pre;
        if (q.armor() != null && !b.armorProficiencies.containsAll(q.armor())) return pre;
        if (q.feature() != null) {
            List<String> chosen = b.featureOptions.get(q.feature());
            if (chosen == null || (q.featureOptions() != null && !q.featureOptions().isEmpty()
                    && chosen.stream().noneMatch(q.featureOptions()::contains))) return pre;
        }
        return null;
    }

    // ---------- Heranças ----------

    // Compra das Heranças com os pontos de Herança. Cada escolha custa 1 ponto do tipo certo:
    // ponto de Região compra Heranças de Região e Gerais; de Origem, de Origem e Gerais; ANY, qualquer uma.
    private void heritages(CreationRequest r, Build b) {
        Map<String, Integer> times = new LinkedHashMap<>();
        Map<String, String> options = new LinkedHashMap<>();
        Map<String, RuleHeritage> byId = new LinkedHashMap<>();
        List<HeritagePick> all = new ArrayList<>(r.heritages() == null ? List.<HeritagePick>of() : r.heritages());
        for (LevelPick lp : r.levelsOrEmpty()) {
            for (HeritagePick pick : lp.heritages() == null ? List.<HeritagePick>of() : lp.heritages()) {
                if (pick == null) continue;
                rules.heritage(pick.id()).ifPresent(h -> {
                    if (h.category() == HeritageCategory.REGION || Boolean.TRUE.equals(h.initial())) {
                        b.errors.add("Herança " + h.name() + ": só na criação do personagem.");
                    }
                });
                all.add(pick);
            }
        }
        for (HeritagePick pick : all) {
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
            String reason = blockReason(h, b, times.keySet(), options);
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
        // As Gerais por último: usam primeiro os pontos só de Gerais, depois o que sobrar, de qualquer tipo.
        for (int i = 0; i < generals; i++) {
            if (!b.spend("GENERAL", "REGION", "ORIGIN", "ANY")) overflow = true;
        }
        if (overflow) b.errors.add("Você escolheu mais Heranças do que tem pontos.");

        boolean canBuy = false;
        for (RuleHeritage h : rules.catalog().heritagesOrEmpty()) {
            String reason = blockReason(h, b, times.keySet(), options);
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
    private String blockReason(RuleHeritage h, Build b, Set<String> chosen, Map<String, String> chosenOptions) {
        if (h.category() == null) return "sem tipo";
        if (b.pools.keySet().stream().noneMatch(scope -> allows(scope, h.category()))) {
            if (b.pools.isEmpty()) return "você não tem pontos de Herança";
            return h.category() == HeritageCategory.REGION ? "seus pontos não compram Heranças de Região"
                    : h.category() == HeritageCategory.ORIGIN ? "seus pontos não compram Heranças de Origem"
                    : "seus pontos não compram Heranças Gerais";
        }
        String pre = "pré-requisito: " + (h.prerequisite() == null ? "não atendido" : h.prerequisite());
        if (!h.anyOfOrEmpty().isEmpty()) {
            // Caminhos alternativos: basta cumprir um (substitui origins/lineages).
            if (h.anyOfOrEmpty().stream().noneMatch(cond -> meets(cond, b, chosen, chosenOptions))) return pre;
        } else {
            if (!h.originsOrEmpty().isEmpty()
                    && (b.origin == null || h.originsOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.origin.id())))) {
                return pre;
            }
            if (!h.lineagesOrEmpty().isEmpty()
                    && (b.lineage == null || h.lineagesOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.lineage.id())))) {
                return pre;
            }
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
        if (!h.requiresOrEmpty().isEmpty()
                && h.requiresOrEmpty().stream().noneMatch(req -> chosen.stream().anyMatch(c -> c.equalsIgnoreCase(req)))) {
            return pre;
        }
        for (String other : h.excludesOrEmpty()) {
            if (chosen.stream().anyMatch(c -> c.equalsIgnoreCase(other))) {
                return "não pode junto com " + rules.heritage(other).map(RuleHeritage::name).orElse(other);
            }
        }
        return null;
    }

    // Um caminho do anyOf: todos os campos preenchidos precisam bater.
    private static boolean meets(HeritageCondition c, Build b, Set<String> chosen, Map<String, String> chosenOptions) {
        if (!c.originsOrEmpty().isEmpty()
                && (b.origin == null || c.originsOrEmpty().stream().noneMatch(o -> o.equalsIgnoreCase(b.origin.id())))) {
            return false;
        }
        if (!c.lineagesOrEmpty().isEmpty()
                && (b.lineage == null || c.lineagesOrEmpty().stream().noneMatch(l -> l.equalsIgnoreCase(b.lineage.id())))) {
            return false;
        }
        if (c.heritage() != null) {
            String id = chosen.stream().filter(x -> x.equalsIgnoreCase(c.heritage())).findFirst().orElse(null);
            if (id == null) return false;
            if (!c.heritageOptionsOrEmpty().isEmpty() && !c.heritageOptionsOrEmpty().contains(chosenOptions.get(id))) return false;
        }
        if (c.feature() != null) {
            List<String> chosenFeature = b.featureOptions.get(c.feature());
            if (chosenFeature == null || (!c.featureOptionsOrEmpty().isEmpty()
                    && chosenFeature.stream().noneMatch(c.featureOptionsOrEmpty()::contains))) return false;
        }
        return true;
    }

    static boolean allows(String scope, HeritageCategory category) {
        return switch (scope) {
            case "REGION" -> category == HeritageCategory.REGION || category == HeritageCategory.GENERAL;
            case "ORIGIN" -> category == HeritageCategory.ORIGIN || category == HeritageCategory.GENERAL;
            case "GENERAL" -> category == HeritageCategory.GENERAL;
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

    // Na criação o personagem é de 1º nível.
    static Integer usesFor(Grant g, int proficiency, boolean roundUp, ToIntFunction<Attribute> modifier) {
        return usesFor(g, proficiency, 1, roundUp, modifier);
    }

    // usesPlus soma um valor fixo à fórmula (Plumadagas = 3 + bônus de proficiência).
    static Integer usesFor(Grant g, int proficiency, int level, boolean roundUp, ToIntFunction<Attribute> modifier) {
        // Tabela por nível do personagem (Mana do Arcanista, Carga Rúnica...) vence a fórmula.
        // Valor nulo na tabela = sem limite a partir desse nível (Fúria do Bruto no 20º): sem contador.
        if (g.usesByLevel() != null && !g.usesByLevel().isEmpty()) return byLevel(g.usesByLevel(), level);
        UsesFormula formula = g.usesFormula() == null ? UsesFormula.FIXED : g.usesFormula();
        // Fixo pode ser nulo (sem usos): fora do switch, que é numérico.
        if (formula == UsesFormula.FIXED) return g.maxUses();
        int uses = switch (formula) {
            case FIXED, PROFICIENCY -> proficiency;
            case HALF_PROFICIENCY -> Math.max(1, half(proficiency, roundUp));
            case ATTRIBUTE_MODIFIER -> Math.max(1, modifier.applyAsInt(g.attribute()));
            case DOUBLE_PROFICIENCY -> proficiency * 2;
            case HALF_LEVEL -> Math.max(1, half(level, roundUp));
            case HALF_ATTRIBUTE_MODIFIER -> Math.max(1, half(modifier.applyAsInt(g.attribute()), roundUp));
            case LEVEL_PLUS_ATTRIBUTE -> Math.max(1, level + modifier.applyAsInt(g.attribute()));
            case PROFICIENCY_PLUS_ATTRIBUTE -> Math.max(1, proficiency + modifier.applyAsInt(g.attribute()));
            case TWO_ATTRIBUTES -> Math.max(1, modifier.applyAsInt(g.attribute()) + modifier.applyAsInt(Attribute.valueOf(g.value())));
        };
        return g.usesPlus() == null ? uses : uses + g.usesPlus();
    }

    // Dado da habilidade: o da tabela por proficiência (maior bônus <= o atual) ou o "damage" fixo.
    // PV de uma concessão HP_BONUS em um nível: amount fixo ou a fórmula (ex.: metade do bônus de proficiência).
    static int hpBonusFor(Grant g, int proficiency, boolean roundUp) {
        return hpBonusFor(g, proficiency, roundUp, a -> 0);
    }

    // Com atributo: Pacto Carmesim = metade do mod. de Inteligência por nível (mínimo 0).
    static int hpBonusFor(Grant g, int proficiency, boolean roundUp, ToIntFunction<Attribute> modifier) {
        if (g.usesFormula() == UsesFormula.ATTRIBUTE_MODIFIER) return Math.max(0, modifier.applyAsInt(g.attribute()));
        if (g.usesFormula() == UsesFormula.HALF_ATTRIBUTE_MODIFIER) return Math.max(0, half(modifier.applyAsInt(g.attribute()), roundUp));
        if (g.usesFormula() == null || g.usesFormula() == UsesFormula.FIXED) return g.amount() == null ? 0 : g.amount();
        return g.usesFormula() == UsesFormula.PROFICIENCY ? proficiency : half(proficiency, roundUp);
    }

    static int half(int value, boolean roundUp) {
        return roundUp ? (value + 1) / 2 : value / 2;
    }

    // Dado com os bônus de damageBonus já somados: "1d6" + proficiência (2) + Força (+3) = "1d6+5".
    static String damageFor(Grant g, int proficiency, boolean roundUp, ToIntFunction<Attribute> modifier) {
        return damageFor(g, proficiency, CREATION_LEVEL, roundUp, modifier);
    }

    static String damageFor(Grant g, int proficiency, int level, boolean roundUp, ToIntFunction<Attribute> modifier) {
        String dice = diceFor(g, proficiency, level);
        if (dice == null || g.damageBonus() == null || g.damageBonus().isEmpty()) return dice;
        Matcher m = DICE_WITH_BONUS.matcher(dice);
        if (!m.matches()) return dice;
        int bonus = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        for (String token : g.damageBonus()) {
            bonus += switch (token) {
                case "PROFICIENCY" -> proficiency;
                case "HALF_PROFICIENCY" -> half(proficiency, roundUp);
                // "Força ou Destreza": vale o maior dos dois (como uma arma com acuidade).
                case "STRENGTH_OR_DEXTERITY" -> Math.max(modifier.applyAsInt(Attribute.STRENGTH), modifier.applyAsInt(Attribute.DEXTERITY));
                default -> modifier.applyAsInt(Attribute.valueOf(token));
            };
        }
        return m.group(1) + (bonus == 0 ? "" : bonus > 0 ? "+" + bonus : String.valueOf(bonus));
    }

    // amount/pés da concessão no nível: a tabela valueByLevel, se houver, senão o valor fixo.
    static Integer valueAt(Grant g, Integer fixed, int level) {
        if (g.valueByLevel() == null || g.valueByLevel().isEmpty()) return fixed;
        Integer v = byLevel(g.valueByLevel(), level);
        return v == null ? fixed : v;
    }

    // Valor da tabela no maior nível <= o atual (null se a tabela só começa depois).
    static <T> T byLevel(Map<String, T> table, int level) {
        return table.entrySet().stream()
                .filter(e -> Integer.parseInt(e.getKey()) <= level)
                .max(Map.Entry.comparingByKey((a, c) -> Integer.compare(Integer.parseInt(a), Integer.parseInt(c))))
                .map(Map.Entry::getValue)
                .orElse(null);
    }

    static String diceFor(Grant g, int proficiency) {
        return diceFor(g, proficiency, CREATION_LEVEL);
    }

    static String diceFor(Grant g, int proficiency, int level) {
        // Dado pelo nível (Ataque Furtivo 1d6 → 10d6).
        if (g.diceByLevel() != null && !g.diceByLevel().isEmpty()) {
            String d = byLevel(g.diceByLevel(), level);
            return d == null ? null : d.replace(" ", "");
        }
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

    CharacterAbility abilityFrom(Character c, Grant g, int proficiency, int level) {
        AbilityType type = g.abilityType() == null ? AbilityType.PASSIVE : g.abilityType();
        Integer uses = usesFor(g, proficiency, level, rules.roundsUp(), c::getModifier);
        CharacterAbility a = new CharacterAbility();
        a.setCharacter(c);
        a.setName(g.name());
        a.setType(type);
        a.setSpellLevel(type == AbilityType.SPELL ? (g.spellLevel() == null ? 0 : g.spellLevel()) : null);
        a.setCastingTime(g.castingTime());
        a.setAbilityRange(g.range());
        a.setDuration(g.duration());
        a.setComponents(g.components());
        a.setDamage(damageFor(g, proficiency, level, rules.roundsUp(), c::getModifier));
        a.setDescription(g.description());
        a.setMaxUses(uses);
        a.setUsesLeft(uses);
        a.setRecharge(uses == null ? Recharge.NONE : g.recharge() == null ? Recharge.LONG_REST : g.recharge());
        return a;
    }

    // Como o livro chama a subclasse da classe ("Glifo", "Cabala"); sem nome, "Subclasse".
    static String subclassLabel(RuleClass klass) {
        return klass == null || klass.subclassLabel() == null ? "Subclasse" : klass.subclassLabel();
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private record Source(String key, String label, List<Grant> grants) {}

    private record ResourceChoice(String key, Grant grant, String source, List<String> picked) {}

    private record SpellChoice(String key, Grant grant, String source, List<String> picked) {}

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
        // Perícias com especialidade (sempre entre as de skills) e as concessões decididas no fim (ver expertise()).
        final Set<SkillType> expertise = new LinkedHashSet<>();
        final List<Deferred> deferred = new ArrayList<>();
        // Recursos de classe: as escolhas (para conferir no fim) e os ids já escolhidos.
        final List<ResourceChoice> resourceChoices = new ArrayList<>();
        final Set<String> resourceIds = new LinkedHashSet<>();
        // Mistérios de magia (MYSTERY e opções de FEATURE com value MYSTERY), magias fixas (id → fonte) e escolhas de magia.
        final Set<String> mysteries = new LinkedHashSet<>();
        final Map<String, String> fixedSpells = new LinkedHashMap<>();
        final List<SpellChoice> spellChoices = new ArrayList<>();
        // CAs que dependem de uma opção escolhida numa habilidade (ArmorFormula.feature).
        final List<Grant> optionArmor = new ArrayList<>();
        final Map<Attribute, String> saves = new LinkedHashMap<>();
        final List<Sourced<Grant>> features = new ArrayList<>();
        // Opção escolhida em cada habilidade com escolha (nome da habilidade → opção), para pré-requisitos de Herança.
        final Map<String, List<String>> featureOptions = new LinkedHashMap<>();
        RuleLineage subclass;
        final Set<String> armorProficiencies = new LinkedHashSet<>();
        final Set<String> weaponProficiencies = new LinkedHashSet<>();
        // Ofícios (ids) com especialidade.
        final Set<String> craftExpertise = new LinkedHashSet<>();
        final List<Grant> hpGrants = new ArrayList<>();
        final List<ChoiceLine> choices = new ArrayList<>();
        final Set<String> languages = new LinkedHashSet<>();
        final Set<String> crafts = new LinkedHashSet<>();
        final List<String> errors = new ArrayList<>();
        // Pontos de Herança por tipo (REGION/ORIGIN/ANY) e quantos já foram gastos de cada.
        final Map<String, Integer> pools = new LinkedHashMap<>();
        final Map<String, Integer> spent = new LinkedHashMap<>();
        final List<HeritageLine> heritages = new ArrayList<>();
        final List<HeritageStatus> heritageOptions = new ArrayList<>();
        // Runinata: fontes e passivas dos traços/desvantagens, a conta e o que dá para escolher.
        final List<Source> traitSources = new ArrayList<>();
        final List<Sourced<Grant>> traitFeatures = new ArrayList<>();
        final List<TraitLine> traitLines = new ArrayList<>();
        final List<TraitStatus> traitOptions = new ArrayList<>();
        TraitBudgetStatus traitBudget;
        boolean traitBackground;
        CreatureSize size;
        boolean sizeFixed;
        int heritagePoints;
        double baseSpeed;
        double speedBonus;
        // Bônus (ou redução) que vale para todos os deslocamentos ("Reduz 5 pés de todos os deslocamentos base").
        double allSpeedBonus;
        final Map<MovementType, Double> otherSpeeds = new EnumMap<>(MovementType.class);
        // CAs alternativas e bônus de CA (viram Character.armorRules).
        final List<ArmorRule> armorRules = new ArrayList<>();
        int gold;
        // Nível do personagem, níveis por classe (na ordem em que entraram), classes e subclasses, de que classe é cada
        // fonte (pelo rótulo) e os dados de vida rolados do 2º nível em diante.
        int level = 1;
        final Map<String, Integer> classLevels = new LinkedHashMap<>();
        final Map<String, RuleClass> classById = new LinkedHashMap<>();
        final Map<String, RuleLineage> subclassByClass = new LinkedHashMap<>();
        final Map<String, String> sourceClass = new LinkedHashMap<>();
        final List<Integer> hpRolls = new ArrayList<>();
        // Classes que entraram por multiclasse (conferir o pré-requisito no fim, com os atributos prontos).
        final List<RuleClass> multiclassed = new ArrayList<>();
        // Equipamento inicial (EQUIPMENT/EQUIPMENT_CHOICE) ou, com wealth, a riqueza inicial da classe no lugar dele.
        final List<EquipmentLine> equipment = new ArrayList<>();
        boolean wealth;
        String wealthFormula;

        // Atributo sem valor base conta como 10 só para a prévia (a criação exige os seis).
        int total(Attribute a) {
            return (base.get(a) == null ? 10 : base.get(a)) + bonus.getOrDefault(a, 0);
        }

        int modifier(Attribute a) {
            return Math.floorDiv(total(a) - 10, 2);
        }

        int maxHp() {
            if (klass == null) return 0;
            int con = modifier(Attribute.CONSTITUTION);
            // HP_BONUS com perLevel soma em cada nível (Pacto Carmesim); sem, uma vez só.
            int bonus = hpGrants.stream().mapToInt(g -> hpBonusFor(g, proficiency(), roundUp, this::modifier)
                    * (Boolean.TRUE.equals(g.perLevel()) ? level : 1)).sum();
            int hp = Math.max(1, klass.hitDie() + con);
            for (int roll : hpRolls) hp += Math.max(1, roll + con);
            return hp + bonus;
        }

        // Bônus de proficiência pelo nível do personagem (2 no 1º, 3 no 5º, 4 no 9º, 5 no 13º, 6 no 17º).
        int proficiency() {
            return 2 + (level - 1) / 4;
        }

        // Nível que vale para as tabelas de uma fonte: o da classe (fontes de classe e subclasse) ou o do personagem.
        int scale(String sourceLabel) {
            String classId = sourceClass.get(sourceLabel);
            return classId == null ? level : classLevels.getOrDefault(classId, level);
        }

        List<ClassLevelLine> classLevelLines() {
            List<ClassLevelLine> out = new ArrayList<>();
            classLevels.forEach((id, n) -> {
                RuleClass k = classById.get(id);
                RuleLineage sub = subclassByClass.get(id);
                out.add(new ClassLevelLine(id, k == null ? id : k.name(), n, k == null || k.hitDie() == null ? 0 : k.hitDie(),
                        sub == null ? null : sub.name()));
            });
            return out;
        }

        double speed() {
            return baseSpeed + speedBonus + allSpeedBonus;
        }

        // Natação, escalada, voo e escavação, com o bônus de "todos os deslocamentos"; sem os que zeraram.
        Map<MovementType, Double> otherSpeedsTotal() {
            Map<MovementType, Double> out = new EnumMap<>(MovementType.class);
            otherSpeeds.forEach((type, feet) -> {
                double total = feet + allSpeedBonus;
                if (total > 0) out.put(type, total);
            });
            return out;
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
            List<SkillLine> skillLines = skills.entrySet().stream().map(e -> new SkillLine(e.getKey(), e.getValue(), expertise.contains(e.getKey()))).toList();
            List<SaveLine> saveLines = saves.entrySet().stream().map(e -> new SaveLine(e.getKey(), e.getValue())).toList();
            List<FeatureLine> featureLines = features.stream()
                    .map(f -> new FeatureLine(f.value().name(), f.value().description(),
                            f.value().abilityType() == null ? AbilityType.PASSIVE : f.value().abilityType(),
                            damageFor(f.value(), proficiency(), scale(f.source()), roundUp, this::modifier), usesFor(f.value(), proficiency(), scale(f.source()), roundUp, this::modifier),
                            f.source()))
                    .toList();
            return new CreationPreview(attrs, pointBuy, skillLines, saveLines, featureLines, List.copyOf(choices),
                    maxHp(), klass == null ? 0 : klass.hitDie(), speed(),
                    origin == null ? List.of() : SpeedLine.of(speed(), otherSpeedsTotal()),
                    origin == null ? null : ArmorClassCalculator.calculate(this::modifier, proficiency(), armorRules, armorProficiencies, List.of(), null),
                    gold, size, List.copyOf(languages),
                    List.copyOf(crafts), List.copyOf(craftExpertise), List.copyOf(armorProficiencies), List.copyOf(weaponProficiencies),
                    heritagePoints,
                    pools.entrySet().stream()
                            .map(e -> new HeritagePool(e.getKey(), e.getValue(), spent.getOrDefault(e.getKey(), 0)))
                            .toList(),
                    List.copyOf(heritages), List.copyOf(heritageOptions), traitBudget, List.copyOf(traitLines),
                    List.copyOf(traitOptions), List.copyOf(equipment), new StartingWealth(wealthFormula, wealth),
                    level, proficiency(), classLevelLines(),
                    List.copyOf(errors), errors.isEmpty());
        }
    }
}
