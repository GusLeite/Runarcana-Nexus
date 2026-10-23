package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.player.Skill;
import gusleite.runarcana_nexus.repository.SkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillsService {
    @Autowired
    SkillsRepository skillRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }
    public Skill createSkill(Skill skill){
        return skillRepository.save(skill);
    }
}
