package com.runarcana.nexus.inventory.repository;

import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacter, Long> {
}
