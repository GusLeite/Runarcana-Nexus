package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.model.notes.PlayerNote;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String body,
        boolean pinned,
        Instant createdAt,
        Instant updatedAt
) {
    public static NoteResponse of(PlayerNote note) {
        return new NoteResponse(note.getId(), note.getTitle(), note.getBody(), note.isPinned(),
                note.getCreatedAt(), note.getUpdatedAt());
    }
}
