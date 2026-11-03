package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.merchant.Merchant;
import gusleite.runarcana_nexus.model.merchant.MerchantHaggle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantHaggleRepository extends JpaRepository<MerchantHaggle, Long> {

    Optional<MerchantHaggle> findByMerchantAndCharacterId(Merchant merchant, Long characterId);

    List<MerchantHaggle> findByMerchantOrderByIdDesc(Merchant merchant);

    void deleteByMerchant(Merchant merchant);
}
