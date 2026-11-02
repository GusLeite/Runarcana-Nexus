package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.merchant.MerchantItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MerchantItemRepository extends JpaRepository<MerchantItem, Long> {
}
