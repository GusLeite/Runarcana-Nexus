package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.documents.DocumentRead;
import gusleite.runarcana_nexus.model.documents.GameDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentReadRepository extends JpaRepository<DocumentRead, Long> {

    @Query("select r.document.id from DocumentRead r where r.account = :account")
    List<Long> findReadDocumentIds(Account account);

    // [id do documento, username] de cada leitura, para a lista do mestre.
    @Query("select r.document.id, r.account.username from DocumentRead r order by r.account.username")
    List<Object[]> findAllReaders();

    @Query("select r.account.username from DocumentRead r where r.document = :document order by r.account.username")
    List<String> findReaders(GameDocument document);

    boolean existsByDocumentAndAccount(GameDocument document, Account account);

    @Modifying
    @Query("delete from DocumentRead r where r.document = :document")
    void deleteByDocument(GameDocument document);
}
