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
import gusleite.runarcana_nexus.record.CastResponse;
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
    private final RuleCatalogService rules;

    public AbilityService(CharacterAbilityRepository abilities, CharacterRepository characters, CharacterService characterService,
                          RuleCatalogService rules) {
        this.rules = rules;
        this.abilities = abilities;
        this.characters = characters;
        this.characterService = characterService;
    }

    @Transactional(readOnly = true)
    public List<AbilityResponse> listFor(Long characterId) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        return SpellcastingRules.responses(character, abilities.findByCharacterOrderByIdAsc(character));
    }

    @Transactional
    public AbilityResponse create(Long characterId, AbilityRequest request) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));

        CharacterAbility ability = new CharacterAbility();
        ability.setCharacter(character);
        fill(ability, request);
        ability.setUsesLeft(request.maxUses());
        ability.setIcon(blankToNull(request.icon()));

        return AbilityResponse.of(abilities.save(ability));
    }

    // Mestre edita: mantém o ícone (a não ser que mande outro) e os usos gastos, limitados ao novo máximo.
    @Transactional
    public AbilityResponse update(Long characterId, Long abilityId, AbilityRequest request) {
        Character character = characters.findById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        CharacterAbility ability = find(character, abilityId);
        Integer spent = ability.getMaxUses() == null || ability.getUsesLeft() == null ? 0 : ability.getMaxUses() - ability.getUsesLeft();
        fill(ability, request);
        ability.setUsesLeft(request.maxUses() == null ? null : Math.max(0, request.maxUses() - spent));
        if (request.icon() != null && !request.icon().isBlank()) ability.setIcon(request.icon().trim());
        List<SpellcastingRules.Casting> castings = SpellcastingRules.castings(character, abilities.findByCharacterOrderByIdAsc(character));
        return AbilityResponse.of(ability, SpellcastingRules.forSpell(character, castings, ability));
    }

    private static void fill(CharacterAbility ability, AbilityRequest request) {
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
        ability.setRecharge(request.maxUses() == null ? Recharge.NONE
                : request.recharge() == null ? Recharge.LONG_REST : request.recharge());
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
        Character character = characterService.characterOf(account);
        CharacterAbility ability = find(character, abilityId);
        if (ability.getMaxUses() == null) {
            throw ApiException.badRequest("Essa habilidade não tem usos para contar.");
        }
        if (usesLeft > ability.getMaxUses()) {
            throw ApiException.badRequest("Não dá para ter mais usos que o máximo (" + ability.getMaxUses() + ").");
        }
        ability.setUsesLeft(usesLeft);
        List<SpellcastingRules.Casting> castings = SpellcastingRules.castings(character, abilities.findByCharacterOrderByIdAsc(character));
        return AbilityResponse.of(ability, SpellcastingRules.forSpell(character, castings, ability));
    }

    // Descanso curto recupera o que volta no curto; o longo recupera tudo.
    @Transactional
    public List<AbilityResponse> rest(Account account, RestType type) {
        Character character = characterService.characterOf(account);
        CharacterService.clearDeathSaves(character);
        if (type == RestType.LONG && character.getExhaustion() != null && character.getExhaustion() > 0) {
            character.setExhaustion(Math.max(0, character.getExhaustion() - Math.max(0, character.getModifier(gusleite.runarcana_nexus.enums.Attribute.CONSTITUTION))));
        }
        List<CharacterAbility> list = abilities.findByCharacterOrderByIdAsc(character);
        for (CharacterAbility ability : list) {
            if (ability.getMaxUses() == null) continue;
            boolean recovers = type == RestType.LONG
                    ? ability.getRecharge() != Recharge.NONE
                    : ability.getRecharge() == Recharge.SHORT_REST;
            if (recovers) ability.setUsesLeft(ability.getMaxUses());
        }
        return SpellcastingRules.responses(character, list);
    }

    // Conjurar (Capítulo 10): truque não gasta nada; magia com usos próprios ("sem Mana, X vezes") no nível dela gasta
    // um uso enquanto houver; senão gasta a Mana do nível (MagicRules.manaCost) da habilidade "Pontos de Mana".
    // O nível vai do nível da magia ao maior nível máximo de magia da ficha (o maior entre as classes).
    @Transactional
    public CastResponse cast(Account account, Long abilityId, Integer requested) {
        Character character = characterService.characterOf(account);
        List<CharacterAbility> list = abilities.findByCharacterOrderByIdAsc(character);
        CharacterAbility spell = find(character, abilityId);
        if (spell.getType() != AbilityType.SPELL) throw ApiException.badRequest("Só dá para conjurar magias.");
        if (Boolean.FALSE.equals(spell.getPrepared())) throw ApiException.badRequest(spell.getName() + " não está preparada.");
        int base = spell.getSpellLevel() == null ? 0 : spell.getSpellLevel();
        if (base == 0) return new CastResponse(0, 0, false, SpellcastingRules.responses(character, list));
        int level = requested == null ? base : requested;
        if (level < base) throw ApiException.badRequest(spell.getName() + " é de " + base + "º nível; não dá para conjurar abaixo disso.");
        if (level == base && spell.getMaxUses() != null && spell.getUsesLeft() != null && spell.getUsesLeft() > 0) {
            spell.setUsesLeft(spell.getUsesLeft() - 1);
            return new CastResponse(level, 0, true, SpellcastingRules.responses(character, list));
        }
        int max = Math.max(base, SpellcastingRules.maxSpellLevel(SpellcastingRules.castings(character, list)));
        if (level > max) throw ApiException.badRequest("Você conjura magias até o " + max + "º nível.");
        Integer cost = MagicRules.manaCost(rules.catalog().magic(), level);
        if (cost == null) throw ApiException.badRequest("Nível de magia inválido.");
        CharacterAbility mana = list.stream().filter(a -> SpellcastingRules.MANA.equals(a.getName()) && a.getMaxUses() != null).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Sua ficha não tem Pontos de Mana."));
        int left = mana.getUsesLeft() == null ? 0 : mana.getUsesLeft();
        if (left < cost) {
            throw ApiException.badRequest("Mana insuficiente: " + spell.getName() + " no " + level + "º nível custa " + cost + " e você tem " + left + ".");
        }
        mana.setUsesLeft(left - cost);
        return new CastResponse(level, cost, false, SpellcastingRules.responses(character, list));
    }

    private CharacterAbility find(Character character, Long abilityId) {
        return abilities.findByIdAndCharacter(abilityId, character)
                .orElseThrow(() -> ApiException.notFound("Habilidade não encontrada."));
    }
}
