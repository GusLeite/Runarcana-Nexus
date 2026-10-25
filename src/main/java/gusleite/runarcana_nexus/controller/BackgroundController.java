package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.model.player.Background;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import gusleite.runarcana_nexus.record.BackGroundSkillsRequest;
import gusleite.runarcana_nexus.record.CharacterClassRequest;
import gusleite.runarcana_nexus.services.BackgroundService;
import gusleite.runarcana_nexus.services.CharacterClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/background")
public class BackgroundController {
    @Autowired
    private BackgroundService service;


    @PostMapping
    public ResponseEntity<Background> create(
            @RequestBody Background request) {

        Background created = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(created);
    }

    @GetMapping
    public ResponseEntity<List<Background>> getAll(){
        return  ResponseEntity.ok(service.getAllClasses());
    }

    @PatchMapping("/{name}")
    public ResponseEntity<Background> getbyName(@PathVariable String name,@RequestBody BackGroundSkillsRequest request){
        return  ResponseEntity.ok(service.getBackGroundByName(name,request));
    }
}