package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    @Autowired
    ItemRepository itemRepository;

    public List<Item> getAllCharacters(){
        return itemRepository.findAll();
    }
    public Item createCharacter(Item item){
        return itemRepository.save(item);
    }
}
