package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CharacterService {
    @Autowired
    CharacterRepository charRepository;

    public List<Character> getAllCharacters(){
        return charRepository.findAll();
    }
    public Character createCharacter(Character character){
        return charRepository.save(character);
    }
}
