package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.DocumentKind;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.documents.GameDocument;

import java.time.Instant;
import java.util.List;

// recipients e readBy (quem já leu) só vêm preenchidos para o mestre; o jogador não fica sabendo quem mais recebeu.
public record DocumentResponse(
        Long id,
        String title,
        DocumentKind kind,
        String body,
        String imageUrl,
        Instant createdAt,
        boolean toAll,
        List<String> recipients,
        boolean read,
        List<String> readBy
) {
    public static DocumentResponse forPlayer(GameDocument d, boolean read) {
        return new DocumentResponse(d.getId(), d.getTitle(), d.getKind(), d.getBody(), d.getImageUrl(),
                d.getCreatedAt(), d.isToAll(), null, read, null);
    }

    public static DocumentResponse forMaster(GameDocument d, List<String> readBy) {
        List<String> recipients = d.getRecipients().stream().map(Account::getUsername).sorted().toList();
        return new DocumentResponse(d.getId(), d.getTitle(), d.getKind(), d.getBody(), d.getImageUrl(),
                d.getCreatedAt(), d.isToAll(), recipients, true, readBy);
    }
}
