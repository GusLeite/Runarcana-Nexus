package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.notes.PlayerNote;
import gusleite.runarcana_nexus.record.NoteRequest;
import gusleite.runarcana_nexus.record.NoteResponse;
import gusleite.runarcana_nexus.repository.PlayerNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NoteService {

    private static final String UNTITLED = "Sem título";

    private final PlayerNoteRepository notes;

    public NoteService(PlayerNoteRepository notes) {
        this.notes = notes;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> list(Account account) {
        return notes.findByAccountOrderByPinnedDescUpdatedAtDesc(account).stream().map(NoteResponse::of).toList();
    }

    @Transactional
    public NoteResponse create(Account account, NoteRequest request) {
        PlayerNote note = new PlayerNote();
        note.setAccount(account);
        note.setCreatedAt(Instant.now());
        apply(note, request);
        return NoteResponse.of(notes.save(note));
    }

    @Transactional
    public NoteResponse update(Account account, Long id, NoteRequest request) {
        PlayerNote note = find(account, id);
        apply(note, request);
        return NoteResponse.of(note);
    }

    @Transactional
    public void delete(Account account, Long id) {
        notes.delete(find(account, id));
    }

    private static void apply(PlayerNote note, NoteRequest request) {
        String title = request.title() == null ? "" : request.title().trim();
        note.setTitle(title.isEmpty() ? UNTITLED : title);
        note.setBody(request.body() == null ? "" : request.body());
        note.setPinned(Boolean.TRUE.equals(request.pinned()));
        note.setUpdatedAt(Instant.now());
    }

    // Nota de outra conta responde 404, para não revelar que existe.
    private PlayerNote find(Account account, Long id) {
        return notes.findByIdAndAccount(id, account)
                .orElseThrow(() -> ApiException.notFound("Anotação não encontrada."));
    }
}
