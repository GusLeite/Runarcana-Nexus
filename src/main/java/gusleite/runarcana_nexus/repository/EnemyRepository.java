package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.combat.Enemy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnemyRepository extends JpaRepository<Enemy, Long> {

    List<Enemy> findAllByOrderByNameAsc();
}
