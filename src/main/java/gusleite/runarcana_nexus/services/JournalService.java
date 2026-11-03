package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.journal.JournalEntry;
import gusleite.runarcana_nexus.model.journal.JournalEntry.Kind;
import gusleite.runarcana_nexus.model.map.MapPoi;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.JournalEntryRepository;
import gusleite.runarcana_nexus.repository.MapPoiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

// Diário do grupo: a mesa inteira lê; cada um escreve, edita e apaga as próprias entradas (o mestre, qualquer uma).
// Os outros serviços chamam record(...) para os eventos automáticos. Não depende do CharacterService (que o usa).
@Service
public class JournalService {

    static final String MASTER_NAME = "Mestre";

    private final JournalEntryRepository entries;
    private final CharacterRepository characters;
    private final MapPoiRepository pois;

    public JournalService(JournalEntryRepository entries, CharacterRepository characters, MapPoiRepository pois) {
        this.pois = pois;
        this.entries = entries;
        this.characters = characters;
    }

    // poiId: local do mapa a que a entrada se refere (nulo = nenhum).
    public record JournalRequest(String title, String body, Long poiId) {}

    // mine: quem pediu pode editar e apagar (autor ou mestre).
    // poiId e poiName só vêm se quem pede vê o ponto.
    public record JournalView(long id, Kind kind, String who, String title, String body, Instant createdAt, Instant updatedAt, boolean mine, Long poiId, String poiName) {}

    @Transactional(readOnly = true)
    public List<JournalView> list(Account account) {
        return entries.findTop300ByOrderByCreatedAtDescIdDesc().stream().map(e -> view(e, account)).toList();
    }

    @Transactional
    public JournalView create(Account account, JournalRequest request) {
        JournalEntry e = new JournalEntry();
        e.setKind(Kind.NOTE);
        e.setAuthor(account);
        e.setWho(nameOf(account));
        e.setCreatedAt(Instant.now());
        apply(e, request, account);
        return view(entries.save(e), account);
    }

    @Transactional
    public JournalView update(Account account, long id, JournalRequest request) {
        JournalEntry e = own(account, id);
        apply(e, request, account);
        return view(e, account);
    }

    @Transactional
    public void delete(Account account, long id) {
        entries.delete(own(account, id));
    }

    // Evento automático sobre um personagem. O personagem de teste do mestre não entra no diário.
    public void record(Kind kind, Character c, String title) {
        if (c.getAccount() != null && AuthService.TEST_PLAYER.equals(c.getAccount().getUsername())) return;
        record(kind, c.getCharacterName(), title);
    }

    public void record(Kind kind, String who, String title) {
        record(kind, who, title, null);
    }

    public void record(Kind kind, String who, String title, MapPoi poi) {
        JournalEntry e = new JournalEntry();
        e.setKind(kind);
        e.setWho(who);
        e.setTitle(cut(title, JournalEntry.MAX_TITLE));
        e.setPoi(poi);
        e.setCreatedAt(Instant.now());
        entries.save(e);
    }

    // O ponto só pode ser citado por quem o vê (senão o diário entregaria o nome de um local secreto).
    private MapPoi visiblePoi(Account account, long poiId) {
        return pois.findById(poiId)
                .filter(p -> RecipientResolver.reaches(account, p.isToAll(), p.getRecipients()))
                .orElseThrow(() -> ApiException.badRequest("Local não encontrado."));
    }

    // Entradas e eventos ligados ao ponto (quem chama já conferiu que a conta vê o ponto).
    @Transactional(readOnly = true)
    public List<JournalView> about(Account account, MapPoi poi) {
        return entries.findByPoiOrderByCreatedAtDescIdDesc(poi).stream().map(e -> view(e, account)).toList();
    }

    public void unlinkPoi(MapPoi poi) {
        entries.clearPoi(poi);
    }

    private JournalEntry own(Account account, long id) {
        JournalEntry e = entries.findById(id).orElseThrow(() -> ApiException.notFound("Entrada não encontrada."));
        if (e.getKind() != Kind.NOTE && !account.isMaster()) throw ApiException.forbidden("Só o mestre mexe nos eventos do diário.");
        if (!canEdit(e, account)) throw ApiException.forbidden("Só quem escreveu (ou o mestre) mexe nesta entrada.");
        return e;
    }

    private static boolean canEdit(JournalEntry e, Account account) {
        return account.isMaster() || (e.getAuthor() != null && e.getAuthor().getId().equals(account.getId()));
    }

    private void apply(JournalEntry e, JournalRequest r, Account account) {
        String title = r == null || r.title() == null ? "" : r.title().trim();
        String body = r == null || r.body() == null ? "" : r.body().trim();
        if (r == null) throw ApiException.badRequest("Escreva algo no diário.");
        if (title.isEmpty() && body.isEmpty()) throw ApiException.badRequest("Escreva algo no diário.");
        if (title.length() > JournalEntry.MAX_TITLE) throw ApiException.badRequest("O título vai até " + JournalEntry.MAX_TITLE + " caracteres.");
        if (body.length() > JournalEntry.MAX_BODY) throw ApiException.badRequest("O texto vai até " + JournalEntry.MAX_BODY + " caracteres.");
        e.setTitle(title.isEmpty() ? null : title);
        e.setBody(body.isEmpty() ? null : body);
        e.setPoi(r.poiId() == null ? null : visiblePoi(account, r.poiId()));
        e.setUpdatedAt(Instant.now());
    }

    // Mesma ligação conta → ficha do CharacterService.findCharacterOf (pela conta ou, nas antigas, pelo nome).
    private String nameOf(Account account) {
        if (account.isMaster()) return MASTER_NAME;
        return characters.findFirstByAccountOrderByIdAsc(account)
                .or(() -> characters.findFirstByCharacterNameIgnoreCaseAndAccountIsNullOrderByIdAsc(account.getUsername()))
                .map(Character::getCharacterName)
                .orElse(account.getUsername());
    }

    private static String cut(String text, int max) {
        return text == null || text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }

    private static JournalView view(JournalEntry e, Account account) {
        MapPoi poi = e.getPoi();
        boolean sees = poi != null && RecipientResolver.reaches(account, poi.isToAll(), poi.getRecipients());
        return new JournalView(e.getId(), e.getKind(), e.getWho(), e.getTitle(), e.getBody(), e.getCreatedAt(), e.getUpdatedAt(), canEdit(e, account),
                sees ? poi.getId() : null, sees ? poi.getName() : null);
    }
}
