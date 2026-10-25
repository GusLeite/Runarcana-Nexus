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

    boolean existsByDocumentAndAccount(GameDocument document, Account account);

    @Modifying
    @Query("delete from DocumentRead r where r.document = :document")
    void deleteByDocument(GameDocument document);
}
