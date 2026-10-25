package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterSkill;
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

@Service
public class CharacterService {

    private final CharacterRepository charRepository;
    private final CharacterClassRepository classRepository;
    private final BackGroundRepository backgroundRepository;
    private final PlayerItemsRepository itemsRepository;
    private final CharacterAbilityRepository abilityRepository;

    public CharacterService(CharacterRepository charRepository,
                            CharacterClassRepository classRepository,
                            BackGroundRepository backgroundRepository,
                            PlayerItemsRepository itemsRepository,
                            CharacterAbilityRepository abilityRepository) {
        this.charRepository = charRepository;
        this.classRepository = classRepository;
        this.backgroundRepository = backgroundRepository;
        this.itemsRepository = itemsRepository;
        this.abilityRepository = abilityRepository;
    }

    @Transactional(readOnly = true)
    public List<CharacterResponse> getAllCharacters() {
        return charRepository.findAll().stream().map(CharacterResponse::of).toList();
    }

    // A conta e o personagem têm o mesmo nome (conta "rudo" ↔ personagem "Rudo").
    public Character characterOf(Account account) {
        return charRepository.findFirstByCharacterNameIgnoreCaseOrderByIdAsc(account.getUsername())
                .orElseThrow(() -> ApiException.notFound("Sua ficha ainda não foi criada. Fale com o mestre."));
    }

    @Transactional(readOnly = true)
    public CharacterSheetResponse getSheet(Account account) {
        Character character = characterOf(account);

        List<InventoryItemResponse> inventory = itemsRepository.findByCharacterOrderByIdAsc(character).stream()
                .map(InventoryItemResponse::of)
                .toList();
        List<AbilityResponse> abilities = abilityRepository.findByCharacterOrderByIdAsc(character).stream()
                .map(AbilityResponse::of)
                .toList();

        return new CharacterSheetResponse(CharacterResponse.of(character), inventory, abilities);
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
