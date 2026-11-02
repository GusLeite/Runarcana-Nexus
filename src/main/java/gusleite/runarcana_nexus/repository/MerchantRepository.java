package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.merchant.Merchant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    List<Merchant> findAllByOrderByIdAsc();

    Optional<Merchant> findFirstByActiveTrueOrderByIdAsc();

    // Uma negociação por vez na loja: dois jogadores não levam a última unidade.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Merchant> findFirstWithLockByActiveTrueOrderByIdAsc();
}
