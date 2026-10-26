package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.enums.RestType;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.CharacterAbility;
import gusleite.runarcana_nexus.record.AbilityRequest;
import gusleite.runarcana_nexus.record.AbilityResponse;
import gusleite.runarcana_nexus.repository.CharacterAbilityRepository;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Magias e habilidades: o mestre cadastra e remove; o jogador gasta usos e descansa.
@Service
public class AbilityService {

    private final CharacterAbilityRepository abilities;
    private final CharacterRepository characters;
    private final CharacterService characterService;

    public AbilityService(CharacterAbilityRepository abilities, CharacterRepository characters, CharacterService characterService) {
        this.abilities = abilities;
        this.characters = characters;
        this.characterService = characterService;
    }

    @Transactional(readOnly = true)
    public List<AbilityResponse> listFor(Long characterId) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        return abilities.findByCharacterOrderByIdAsc(character).stream().map(AbilityResponse::of).toList();
    }

    @Transactional
    public AbilityResponse create(Long characterId, AbilityRequest request) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));

        CharacterAbility ability = new CharacterAbility();
        ability.setCharacter(character);
        ability.setName(request.name().trim());
        ability.setType(request.type());
        // Círculo só faz sentido em magia.
        ability.setSpellLevel(request.type() == AbilityType.SPELL ? request.spellLevel() : null);
        ability.setSchool(request.school());
        ability.setCastingTime(request.castingTime());
        ability.setAbilityRange(request.range());
        ability.setDuration(request.duration());
        ability.setComponents(request.components());
        ability.setDamage(request.damage() == null ? null : request.damage().replace(" ", ""));
        ability.setDescription(request.description());
        ability.setMaxUses(request.maxUses());
        ability.setUsesLeft(request.maxUses());
        ability.setRecharge(request.maxUses() == null ? Recharge.NONE
                : request.recharge() == null ? Recharge.LONG_REST : request.recharge());
        ability.setIcon(blankToNull(request.icon()));

        return AbilityResponse.of(abilities.save(ability));
    }

    @Transactional
    public AbilityResponse setIcon(Long characterId, Long abilityId, String icon) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        CharacterAbility ability = find(character, abilityId);
        ability.setIcon(blankToNull(icon));
        return AbilityResponse.of(ability);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public void delete(Long characterId, Long abilityId) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        abilities.delete(find(character, abilityId));
    }

    @Transactional
    public AbilityResponse setUses(Account account, Long abilityId, int usesLeft) {
        CharacterAbility ability = find(characterService.characterOf(account), abilityId);
        if (ability.getMaxUses() == null) {
            throw ApiException.badRequest("Essa habilidade não tem usos para contar.");
        }
        if (usesLeft > ability.getMaxUses()) {
            throw ApiException.badRequest("Não dá para ter mais usos que o máximo (" + ability.getMaxUses() + ").");
        }
        ability.setUsesLeft(usesLeft);
        return AbilityResponse.of(ability);
    }

    // Descanso curto recupera o que volta no curto; o longo recupera tudo.
    @Transactional
    public List<AbilityResponse> rest(Account account, RestType type) {
        Character character = characterService.characterOf(account);
        List<CharacterAbility> list = abilities.findByCharacterOrderByIdAsc(character);
        for (CharacterAbility ability : list) {
            if (ability.getMaxUses() == null) continue;
            boolean recovers = type == RestType.LONG
                    ? ability.getRecharge() != Recharge.NONE
                    : ability.getRecharge() == Recharge.SHORT_REST;
            if (recovers) ability.setUsesLeft(ability.getMaxUses());
        }
        return list.stream().map(AbilityResponse::of).toList();
    }

    private CharacterAbility find(Character character, Long abilityId) {
        return abilities.findByIdAndCharacter(abilityId, character)
                .orElseThrow(() -> ApiException.notFound("Habilidade não encontrada."));
    }
}
