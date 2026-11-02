package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.LevelUpPreview;
import gusleite.runarcana_nexus.record.LevelUpRequest;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Subida de nível em duas partes: o mestre libera os níveis (pendingLevels) e o jogador faz as escolhas na própria
// ficha. As contas ficam no CreationService.
@Service
public class LevelUpService {

    private final CreationService creation;
    private final CharacterService characterService;
    private final CharacterRepository characters;

    public LevelUpService(CreationService creation, CharacterService characterService, CharacterRepository characters) {
        this.creation = creation;
        this.characterService = characterService;
        this.characters = characters;
    }

    // Mestre: quantos níveis a ficha pode subir (0 cancela). Não passa do 20º nível.
    @Transactional
    public CharacterResponse setPending(long characterId, int pending) {
        Character c = characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        if (c.getBuild() == null) {
            throw ApiException.badRequest("Esta ficha não foi criada pelo assistente: a subida de nível precisa das escolhas da criação.");
        }
        if (pending < 0 || c.getLevel() + pending > 20) {
            throw ApiException.badRequest("Dá para liberar de 0 a " + (20 - c.getLevel()) + " nível(is) para esta ficha.");
        }
        c.setPendingLevels(pending);
        return CharacterResponse.of(c);
    }

    // Jogador: prévia dos níveis liberados, sem salvar.
    @Transactional(readOnly = true)
    public LevelUpPreview preview(Account account, LevelUpRequest request) {
        Character c = released(account, request);
        return creation.levelUpPreview(c.getId(), request);
    }

    // Jogador: aplica e desconta dos níveis liberados (um erro desfaz os dois).
    @Transactional
    public CharacterResponse apply(Account account, LevelUpRequest request) {
        Character c = released(account, request);
        c.setPendingLevels(pendingOf(c) - request.levelsOrEmpty().size());
        return creation.levelUp(c.getId(), request);
    }

    private Character released(Account account, LevelUpRequest request) {
        Character c = characterService.characterOf(account);
        int asked = request.levelsOrEmpty().size();
        if (pendingOf(c) == 0) throw ApiException.forbidden("O mestre ainda não liberou a subida de nível.");
        if (asked == 0) throw ApiException.badRequest("Informe o nível a subir.");
        if (asked > pendingOf(c)) throw ApiException.forbidden("O mestre liberou só " + pendingOf(c) + " nível(is).");
        return c;
    }

    private static int pendingOf(Character c) {
        return c.getPendingLevels() == null ? 0 : c.getPendingLevels();
    }
}
