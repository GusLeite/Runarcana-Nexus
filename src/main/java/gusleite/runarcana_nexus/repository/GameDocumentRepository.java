package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.documents.GameDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameDocumentRepository extends JpaRepository<GameDocument, Long> {

    // Documentos para todos ou endereçados à conta, do mais novo para o mais antigo.
    @Query("select distinct d from GameDocument d left join d.recipients r " +
            "where d.toAll = true or r = :account order by d.createdAt desc, d.id desc")
    List<GameDocument> findVisibleTo(Account account);

    List<GameDocument> findAllByOrderByCreatedAtDescIdDesc();
}
