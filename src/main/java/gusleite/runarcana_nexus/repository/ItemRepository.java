package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.items.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item,Long> {

    Optional<Item> findFirstByCatalogId(String catalogId);
}
