package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterSkill;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.model.items.Armor;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.items.Weapon;
import gusleite.runarcana_nexus.record.AttackResponse;
import gusleite.runarcana_nexus.record.SpellcastingResponse;
import gusleite.runarcana_nexus.record.CraftResponse;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.record.TableCardResponse;
import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.record.ArmorClassResponse;
import org.hibernate.Hibernate;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.AbilityResponse;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CreateCharacterRequest;
import gusleite.runarcana_nexus.record.InventoryItemResponse;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterAbilityRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.PlayerItemsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gusleite.runarcana_nexus.model.player.ClassLevel;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CharacterService {

    private final CharacterRepository charRepository;
    private final CharacterClassRepository classRepository;
    private final BackGroundRepository backgroundRepository;
    private final PlayerItemsRepository itemsRepository;
    private final CharacterAbilityRepository abilityRepository;
    private final RuleCatalogService rules;
    private final FormulaService formulas;

    public CharacterService(CharacterRepository charRepository,
                            CharacterClassRepository classRepository,
                            BackGroundRepository backgroundRepository,
                            PlayerItemsRepository itemsRepository,
                            CharacterAbilityRepository abilityRepository,
                            RuleCatalogService rules,
                            FormulaService formulas) {
        this.formulas = formulas;
        this.charRepository = charRepository;
        this.classRepository = classRepository;
        this.backgroundRepository = backgroundRepository;
        this.itemsRepository = itemsRepository;
        this.abilityRepository = abilityRepository;
        this.rules = rules;
    }

    // Visão da mesa (mestre): todas as fichas com a CA em uso e a Mana.
    @Transactional(readOnly = true)
    public List<TableCardResponse> table() {
        return charRepository.findAll().stream().map(c -> {
            List<PlayerItems> items = itemsRepository.findByCharacterOrderByIdAsc(c);
            CharacterAbility mana = abilityRepository.findByCharacterOrderByIdAsc(c).stream()
                    .filter(a -> SpellcastingRules.MANA.equals(a.getName()) && a.getMaxUses() != null).findFirst().orElse(null);
            return new TableCardResponse(CharacterResponse.of(c), armorClassOf(c, items).value(),
                    mana == null ? null : mana.getUsesLeft(), mana == null ? null : mana.getMaxUses());
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> getAllCharacters() {
        return charRepository.findAll().stream().map(CharacterResponse::of).toList();
    }

    // Ficha da conta: pela ligação direta (fichas criadas pelo assistente) ou, nas fichas antigas,
    // pelo nome (conta "rudo" ↔ personagem "Rudo").
    public Optional<Character> findCharacterOf(Account account) {
        return charRepository.findFirstByAccountOrderByIdAsc(account)
                .or(() -> charRepository.findFirstByCharacterNameIgnoreCaseAndAccountIsNullOrderByIdAsc(account.getUsername()));
    }

    public Character characterOf(Account account) {
        return findCharacterOf(account)
                .orElseThrow(() -> ApiException.notFound("Sua ficha ainda não foi criada. Crie seu personagem."));
    }

    @Transactional(readOnly = true)
    public CharacterSheetResponse getSheet(Account account) {
        Character character = characterOf(account);

        List<PlayerItems> items = itemsRepository.findByCharacterOrderByIdAsc(character);
        List<InventoryItemResponse> inventory = items.stream()
                .map(e -> InventoryItemResponse.of(e, EquipmentRules.consumable(rules.catalog().equipment(), e.getItem())))
                .toList();
        List<CharacterAbility> rows = abilityRepository.findByCharacterOrderByIdAsc(character);
        List<AbilityResponse> abilities = SpellcastingRules.responses(character, rows);

        return new CharacterSheetResponse(CharacterResponse.of(character), armorClassOf(character, items),
                attacksOf(character, items), spellcastingOf(character, rows), craftsOf(character), inventory, abilities);
    }

    // Escolhe a defesa em uso ("UNARMORED", "RULE:<n>" ou "ITEM:<id>") entre as opções da ficha.
    @Transactional
    public ArmorClassResponse chooseDefense(Account account, String key) {
        Character character = characterOf(account);
        List<PlayerItems> items = itemsRepository.findByCharacterOrderByIdAsc(character);
        ArmorClassResponse current = armorClassOf(character, items);
        if (key == null || current.options().stream().noneMatch(o -> o.key().equals(key))) {
            throw ApiException.badRequest("Essa defesa não está disponível para a sua ficha.");
        }
        character.setDefense(key);
        charRepository.save(character);
        return armorClassOf(character, items);
    }

    // PV da própria ficha: o jogador marca dano, cura e PV temporários (as contas ficam no front; aqui só os limites).
    public CharacterResponse setHp(Account account, Integer currentHp, Integer tempHp) {
        return applyHp(characterOf(account), currentHp, tempHp);
    }

    // Mestre: bônus nos PV máximos (pode ser negativo); os PV atuais não passam do novo máximo.
    @Transactional
    public CharacterResponse setMaxHpBonus(long characterId, int bonus) {
        Character c = charRepository.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        if (c.getMaxHp() + bonus < 1) throw ApiException.badRequest("Os PV máximos não podem ficar abaixo de 1.");
        c.setMaxHpBonus(bonus);
        c.setCurrentHp(Math.min(c.getCurrentHp(), c.getMaxHpTotal()));
        return CharacterResponse.of(c);
    }

    // Mestre: PV de qualquer ficha (dano e cura na mesa), com os mesmos limites.
    @Transactional
    public CharacterResponse setHpFor(long characterId, Integer currentHp, Integer tempHp) {
        return applyHp(charRepository.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado.")),
                currentHp, tempHp);
    }

    private CharacterResponse applyHp(Character character, Integer currentHp, Integer tempHp) {
        if (currentHp == null) throw ApiException.badRequest("Informe os PV atuais.");
        if (currentHp < 0 || currentHp > character.getMaxHpTotal()) {
            throw ApiException.badRequest("Os PV atuais vão de 0 a " + character.getMaxHpTotal() + ".");
        }
        if (tempHp != null && tempHp < 0) throw ApiException.badRequest("Os PV temporários não podem ser negativos.");
        character.setCurrentHp(currentHp);
        if (tempHp != null) character.setTempHp(tempHp);
        // Com PV de novo, os testes contra a morte zeram.
        if (currentHp > 0) clearDeathSaves(character);
        charRepository.save(character);
        return CharacterResponse.of(character);
    }

    public static void clearDeathSaves(Character character) {
        character.setDeathSuccesses(0);
        character.setDeathFailures(0);
    }

    // Escudo em uso: "NONE" (sem escudo) ou "ITEM:<id>" de um escudo do inventário. Devolve a CA recalculada.
    @Transactional
    public ArmorClassResponse chooseShield(Account account, String key) {
        Character character = characterOf(account);
        List<PlayerItems> items = itemsRepository.findByCharacterOrderByIdAsc(character);
        boolean known = ArmorClassCalculator.NO_SHIELD.equals(key) || shieldsOf(items).stream().anyMatch(s -> s.key().equals(key));
        if (key == null || !known) throw ApiException.badRequest("Esse escudo não está no seu inventário.");
        character.setShield(key);
        charRepository.save(character);
        return armorClassOf(character, items);
    }

    // Escudos do inventário: os itens do catálogo com kind SHIELD e bônus fixo (o Broquel, "Especial", fica de fora).
    private List<ArmorClassCalculator.ShieldItem> shieldsOf(List<PlayerItems> items) {
        return items.stream()
                .filter(e -> e.getItem().getCatalogId() != null)
                .flatMap(e -> EquipmentRules.item(rules.catalog().equipment(), e.getItem().getCatalogId())
                        .filter(r -> "SHIELD".equals(r.kind()) && r.armorClass() != null)
                        .map(r -> new ArmorClassCalculator.ShieldItem("ITEM:" + e.getId(), e.getItem().getName(), r.armorClass()))
                        .stream())
                .toList();
    }

    // Ofícios (Capítulo 4): nível dos maiores = 1 + 1 a cada 4 níveis de personagem desde que foi aprendido (craftLevels;
    // fichas antigas contam do 1º); teste = mod. do atributo base + metade da proficiência (inteira com especialidade).
    private List<CraftResponse> craftsOf(Character character) {
        Map<String, RuleCatalog.Craft> byName = new java.util.HashMap<>();
        rules.catalog().craftsOrEmpty().forEach(k -> byName.put(k.name().toLowerCase(), k));
        return character.getCrafts().stream().sorted().map(name -> {
            RuleCatalog.Craft k = byName.get(name.toLowerCase());
            boolean expert = character.getCraftExpertise().contains(name);
            Attribute attribute = k == null ? null : k.attribute();
            Integer bonus = attribute == null ? null
                    : character.getModifier(attribute) + (expert ? character.getProficiencyBonus() : character.getProficiencyBonus() / 2);
            int learnedAt = character.getCraftLevels().getOrDefault(name, 1);
            Integer level = k != null && "MAJOR".equals(k.kind()) ? 1 + Math.max(0, character.getLevel() - learnedAt) / 4 : null;
            List<CraftResponse.KnownFormula> known = k == null ? List.of() : character.getFormulas().stream()
                    .filter(f -> f.startsWith(k.id() + ":"))
                    .flatMap(f -> formulas.find(f).map(x -> new CraftResponse.KnownFormula(f, x.name()
                            + (x.discipline() == null ? "" : " (" + x.discipline() + ")"), x.level(), x.dc(), x.description())).stream())
                    .sorted(java.util.Comparator.comparingInt(CraftResponse.KnownFormula::level).thenComparing(CraftResponse.KnownFormula::name))
                    .toList();
            int limit = Math.max(1, character.getModifier(Attribute.INTELLIGENCE)) * (level == null ? 1 : level);
            return new CraftResponse(k == null ? null : k.id(), name, k == null ? null : k.kind(), attribute, level, learnedAt, expert, bonus, known, limit);
        }).toList();
    }

    // Conjuração: CD e ataque de magia por fonte, o maior nível de magia e o custo de Mana por nível.
    private SpellcastingResponse spellcastingOf(Character character, List<CharacterAbility> rows) {
        List<SpellcastingRules.Casting> castings = SpellcastingRules.castings(character, rows);
        Map<String, Integer> cost = rules.catalog().magic() == null || rules.catalog().magic().manaCost() == null ? Map.of()
                : rules.catalog().magic().manaCost();
        return new SpellcastingResponse(castings.stream()
                .map(k -> new SpellcastingResponse.Caster(k.source(), k.className(), k.attribute(), k.maxSpellLevel(), k.saveDc(), k.attackBonus()))
                .toList(), SpellcastingRules.maxSpellLevel(castings), cost);
    }

    private static final String MEDIUM_EXPERT = "Especialista em Armadura Média";
    private static final Pattern STYLE = Pattern.compile("Estilo de Luta(?: adicional)? \\((.+)\\)");

    // Ataques: as armas do inventário (pelo catálogo, ou pela linha de Weapon no item sem catálogo) + desarmado.
    private List<AttackResponse> attacksOf(Character character, List<PlayerItems> items) {
        List<AttackCalculator.WeaponInput> weapons = new ArrayList<>();
        for (PlayerItems e : items) {
            Item item = (Item) Hibernate.unproxy(e.getItem());
            String key = "ITEM:" + e.getId();
            Optional<RuleItem> catalog = item.getCatalogId() == null ? Optional.empty()
                    : EquipmentRules.item(rules.catalog().equipment(), item.getCatalogId()).filter(r -> "WEAPON".equals(r.kind()));
            if (catalog.isPresent()) weapons.add(AttackCalculator.fromCatalog(key, catalog.get()));
            else if (item instanceof Weapon w) weapons.add(AttackCalculator.fromWeapon(key, w));
        }
        Set<String> styles = new HashSet<>();
        for (CharacterAbility a : abilityRepository.findByCharacterOrderByIdAsc(character)) {
            Matcher m = STYLE.matcher(a.getName());
            if (m.matches()) for (String s : m.group(1).split(",\\s*")) styles.add(s.trim());
        }
        // "+1 nos níveis 8 e 16": pelo nível de Combatente (ou do personagem, sem a classe).
        int level = character.getClassLevels().stream().filter(l -> "FIGHTER".equals(l.getClassId())).mapToInt(ClassLevel::getLevel)
                .findFirst().orElse(character.getLevel());
        List<AttackResponse> attacks = AttackCalculator.calculate(character::getModifier, character.getProficiencyBonus(),
                character.getWeaponProficiencies(), weapons, styles, level);
        // Notas situacionais de ataque (Arqueiro, Balestreiro, Sagaz...) em cada arma que elas valem.
        List<gusleite.runarcana_nexus.model.player.SituationalNote> attackNotes = character.getSituational().stream()
                .filter(n -> n.getTarget() != null && n.getTarget().startsWith("ATTACK")).toList();
        if (attackNotes.isEmpty()) return attacks;
        return attacks.stream().map(a -> {
            AttackCalculator.WeaponInput w = weapons.stream().filter(x -> x.key().equals(a.key())).findFirst().orElse(null);
            return a.withNotes(attackNotes.stream().filter(n -> AttackCalculator.matches(n.getTarget(), w))
                    .map(n -> n.getSource().replaceFirst("^[^:]+: ", "") + ": " + n.getNote()).toList());
        }).toList();
    }

    // CA da ficha: as regras da criação (Character.armorRules), as armaduras e os escudos do inventário.
    private ArmorClassResponse armorClassOf(Character character, List<PlayerItems> items) {
        List<ArmorClassCalculator.ArmorItem> armors = items.stream()
                .filter(e -> Hibernate.unproxy(e.getItem()) instanceof Armor)
                .map(e -> {
                    Armor a = (Armor) Hibernate.unproxy(e.getItem());
                    return new ArmorClassCalculator.ArmorItem("ITEM:" + e.getId(), a.getName(), a.getArmorClass(),
                            a.getModifierAttribute(), a.getArmorWeight(), a.getDamageReduction());
                })
                .toList();
        return ArmorClassCalculator.calculate(character::getModifier, character.getProficiencyBonus(),
                character.getArmorRules(), character.getArmorProficiencies(), armors, character.getDefense(),
                shieldsOf(items), character.getShield(),
                abilityRepository.findByCharacterOrderByIdAsc(character).stream().anyMatch(a -> MEDIUM_EXPERT.equals(a.getName())));
    }

    @Transactional
    public CharacterResponse createCharacter(CreateCharacterRequest request) {
        if (request.currentHp() > request.maxHp()) {
            throw ApiException.badRequest("Os PV atuais não podem passar dos PV máximos.");
        }

        CharacterClass characterClass = classRepository.findByClassName(request.characterClass())
                .orElseThrow(() -> ApiException.badRequest(
                        "A classe " + request.characterClass() + " ainda não foi cadastrada."));

        Character character = new Character();
        character.setPlayerName(request.playerName().trim());
        character.setCharacterName(request.characterName().trim());
        character.setLevel(request.level());
        character.setGold(request.gold());
        character.setAge(request.age());
        character.setHeight(request.height());
        character.setCharacterClass(characterClass);
        character.setMaxHp(request.maxHp());
        character.setCurrentHp(request.currentHp());
        character.setStr(request.str());
        character.setDex(request.dex());
        character.setIntel(request.intel());
        character.setWis(request.wis());
        character.setCha(request.cha());
        character.setCon(request.con());
        character.setRegion(request.region());
        character.setBackground(findBackground(request.background()));
        character.setAlignment(request.alignment());
        character.setInspiration(request.inspiration());

        // As perícias enviadas são as proficientes; repetidas contam uma vez só.
        if (request.skills() != null) {
            for (SkillType type : new LinkedHashSet<>(request.skills())) {
                CharacterSkill skill = new CharacterSkill();
                skill.setCharacter(character);
                skill.setSkillType(type);
                skill.setProficient(true);
                character.getSkills().add(skill);
            }
        }

        return CharacterResponse.of(charRepository.save(character));
    }

    private Background findBackground(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return backgroundRepository.findByNameIgnoreCase(name.trim())
                .orElseThrow(() -> ApiException.badRequest(
                        "O antecedente \"" + name.trim() + "\" ainda não foi cadastrado."));
    }
}
