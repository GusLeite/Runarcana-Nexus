package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.combat.Encounter;
import gusleite.runarcana_nexus.model.combat.Encounter.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EncounterRepository extends JpaRepository<Encounter, Long> {

    List<Encounter> findTop30ByOrderByIdDesc();

    List<Encounter> findByStatus(Status status);

    Optional<Encounter> findFirstByStatusOrderByIdDesc(Status status);
}
