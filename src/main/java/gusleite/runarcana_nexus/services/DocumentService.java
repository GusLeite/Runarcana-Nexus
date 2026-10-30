package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.documents.DocumentRead;
import gusleite.runarcana_nexus.model.documents.GameDocument;
import gusleite.runarcana_nexus.record.DocumentRequest;
import gusleite.runarcana_nexus.record.DocumentResponse;
import gusleite.runarcana_nexus.repository.AccountRepository;
import gusleite.runarcana_nexus.repository.DocumentReadRepository;
import gusleite.runarcana_nexus.repository.GameDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

// Documentos do mestre para os jogadores.
@Service
public class DocumentService {

    private final GameDocumentRepository documents;
    private final DocumentReadRepository reads;
    private final AccountRepository accounts;

    public DocumentService(GameDocumentRepository documents, DocumentReadRepository reads, AccountRepository accounts) {
        this.documents = documents;
        this.reads = reads;
        this.accounts = accounts;
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listFor(Account account) {
        Set<Long> read = new HashSet<>(reads.findReadDocumentIds(account));
        return documents.findVisibleTo(account).stream()
                .map(d -> DocumentResponse.forPlayer(d, read.contains(d.getId())))
                .toList();
    }

    @Transactional
    public void markRead(Account account, Long id) {
        GameDocument document = documents.findVisibleTo(account).stream()
                .filter(d -> d.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
        if (reads.existsByDocumentAndAccount(document, account)) return;

        DocumentRead read = new DocumentRead();
        read.setDocument(document);
        read.setAccount(account);
        read.setReadAt(Instant.now());
        reads.save(read);
    }

    // Quem pode receber documentos: todas as contas de jogador.
    @Transactional(readOnly = true)
    public List<String> recipients() {
        return accounts.findAll().stream()
                .filter(a -> !a.isMaster())
                .map(Account::getUsername)
                .sorted()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listAll() {
        // Quem leu cada documento (uma consulta só).
        java.util.Map<Long, List<String>> readers = new java.util.HashMap<>();
        for (Object[] row : reads.findAllReaders()) {
            readers.computeIfAbsent((Long) row[0], k -> new java.util.ArrayList<>()).add((String) row[1]);
        }
        return documents.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(d -> DocumentResponse.forMaster(d, readers.getOrDefault(d.getId(), List.of())))
                .toList();
    }

    @Transactional
    public DocumentResponse create(Account master, DocumentRequest request) {
        GameDocument document = new GameDocument();
        document.setAuthor(master);
        document.setCreatedAt(Instant.now());
        fill(document, request);
        return DocumentResponse.forMaster(documents.save(document), List.of());
    }

    // Mestre edita título, tipo, texto, imagem e destinatários; quem já leu continua marcado.
    @Transactional
    public DocumentResponse update(Long id, DocumentRequest request) {
        GameDocument document = documents.findById(id)
                .orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
        fill(document, request);
        return DocumentResponse.forMaster(document, reads.findReaders(document));
    }

    private void fill(GameDocument document, DocumentRequest request) {
        document.setTitle(request.title().trim());
        document.setKind(request.kind());
        document.setBody(request.body() == null ? "" : request.body());
        document.setImageUrl(request.imageUrl());

        Set<String> usernames = new LinkedHashSet<>();
        if (request.recipients() != null) {
            request.recipients().stream().map(AuthService::normalizeUsername).filter(u -> !u.isEmpty()).forEach(usernames::add);
        }
        document.setToAll(usernames.isEmpty());
        document.getRecipients().clear();
        for (String username : usernames) {
            Account recipient = accounts.findByUsername(username)
                    .filter(a -> !a.isMaster())
                    .orElseThrow(() -> ApiException.badRequest("Não existe jogador \"" + username + "\"."));
            document.getRecipients().add(recipient);
        }
    }

    @Transactional
    public void delete(Long id) {
        GameDocument document = documents.findById(id)
                .orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
        reads.deleteByDocument(document);
        documents.delete(document);
    }
}
