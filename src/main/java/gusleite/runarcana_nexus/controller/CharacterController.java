package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.services.CharacterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/character")
public class CharacterController {

    @Autowired
    private CharacterService charService;

    private ResponseEntity<List<Character>> getAllCharacters(){
        return ResponseEntity.ok(charService.getAllCharacters());
    }

    private ResponseEntity<Character> createCharacter(Character character){
        Character charCreated = charService.createCharacter(character);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(charCreated);
    }
}
