package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.player.Skill;
import gusleite.runarcana_nexus.services.SkillsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/skills")
public class SkillController {
    @Autowired
    private SkillsService service;

    @PostMapping
    public ResponseEntity<Skill> create(
            @RequestBody Skill request) {

        Skill created = service.createSkill(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<List<Skill>> getAll(){
        return  ResponseEntity.ok(service.getAllSkills());
    }
}