package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.rolls.TableRoll;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableRollRepository extends JpaRepository<TableRoll, Long> {

    @EntityGraph(attributePaths = "account")
    List<TableRoll> findByOrderByIdDesc(Pageable page);
}
