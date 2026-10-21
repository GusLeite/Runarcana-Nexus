package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CharacterClassService {

    private final CharacterClassRepository repository;

    public CharacterClassService(CharacterClassRepository repository) {
        this.repository = repository;
    }

    public CharacterClass create(CharacterClassRequest request) {
        CharacterClass characterClass = new CharacterClass();

        characterClass.setClassName(request.className());
        characterClass.setHitHpDice(request.hitHpDice());

        return repository.save(characterClass);
    }

    public List<CharacterClass> getAllClasses() {
        return repository.findAll();
    }

}