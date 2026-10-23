package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.BackGroundSkillsRequest;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.repository.BackGroundRepository;
import gusleite.runarcana_nexus.repository.CharacterClassRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BackgroundService {

    private final BackGroundRepository repository;

    public BackgroundService(BackGroundRepository repository) {
        this.repository = repository;
    }

    public Background create(Background request) {

        return repository.save(request);
    }

    public List<Background> getAllClasses() {
        return repository.findAll();
    }

    public Background getBackGroundByName(String name,BackGroundSkillsRequest request) {
        Background background = repository.findByName(name);

        background.setSkills(request.skills());

        Background save = repository.save(background);

        return save;
    }


}