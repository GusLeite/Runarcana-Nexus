package com.runarcana.nexus.inventory.service;

import com.runarcana.nexus.inventory.dto.PlayerCharacterRequest;
import com.runarcana.nexus.inventory.entity.PlayerCharacter;
import com.runarcana.nexus.inventory.exception.ResourceNotFoundException;
import com.runarcana.nexus.inventory.repository.PlayerCharacterRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlayerCharacterService {

    private final PlayerCharacterRepository playerCharacterRepository;

    public PlayerCharacterService(PlayerCharacterRepository playerCharacterRepository) {
        this.playerCharacterRepository = playerCharacterRepository;
    }

    @Transactional
    public PlayerCharacter create(PlayerCharacterRequest request) {
        PlayerCharacter character = new PlayerCharacter();
        character.setName(request.name().trim());
        return playerCharacterRepository.save(character);
    }

    @Transactional(readOnly = true)
    public List<PlayerCharacter> list() {
        return playerCharacterRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PlayerCharacter getById(Long id) {
        return playerCharacterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found: " + id));
    }
}
