package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.merchant.Merchant;
import gusleite.runarcana_nexus.model.merchant.MerchantTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MerchantTradeRepository extends JpaRepository<MerchantTrade, Long> {

    List<MerchantTrade> findTop50ByMerchantOrderByIdDesc(Merchant merchant);

    void deleteByMerchant(Merchant merchant);
}
