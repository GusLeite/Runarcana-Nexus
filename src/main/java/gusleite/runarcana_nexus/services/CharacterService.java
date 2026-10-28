package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterSkill;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.model.items.Armor;
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

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Service
public class CharacterService {

    private final CharacterRepository charRepository;
    private final CharacterClassRepository classRepository;
    private final BackGroundRepository backgroundRepository;
    private final PlayerItemsRepository itemsRepository;
    private final CharacterAbilityRepository abilityRepository;
    private final RuleCatalogService rules;

    public CharacterService(CharacterRepository charRepository,
                            CharacterClassRepository classRepository,
                            BackGroundRepository backgroundRepository,
                            PlayerItemsRepository itemsRepository,
                            CharacterAbilityRepository abilityRepository,
                            RuleCatalogService rules) {
        this.charRepository = charRepository;
        this.classRepository = classRepository;
        this.backgroundRepository = backgroundRepository;
        this.itemsRepository = itemsRepository;
        this.abilityRepository = abilityRepository;
        this.rules = rules;
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
                .map(InventoryItemResponse::of)
                .toList();
        List<AbilityResponse> abilities = abilityRepository.findByCharacterOrderByIdAsc(character).stream()
                .map(AbilityResponse::of)
                .toList();

        return new CharacterSheetResponse(CharacterResponse.of(character), armorClassOf(character, items), inventory, abilities);
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
        Character character = characterOf(account);
        if (currentHp == null) throw ApiException.badRequest("Informe os PV atuais.");
        if (currentHp < 0 || currentHp > character.getMaxHp()) {
            throw ApiException.badRequest("Os PV atuais vão de 0 a " + character.getMaxHp() + ".");
        }
        if (tempHp != null && tempHp < 0) throw ApiException.badRequest("Os PV temporários não podem ser negativos.");
        character.setCurrentHp(currentHp);
        if (tempHp != null) character.setTempHp(tempHp);
        charRepository.save(character);
        return CharacterResponse.of(character);
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
                shieldsOf(items), character.getShield());
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
