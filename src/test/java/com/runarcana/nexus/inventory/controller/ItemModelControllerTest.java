package com.runarcana.nexus.inventory.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.runarcana.nexus.inventory.dto.ItemModelRequest;
import com.runarcana.nexus.inventory.entity.ItemModel;
import com.runarcana.nexus.inventory.entity.ItemType;
import com.runarcana.nexus.inventory.mapper.InventoryMapper;
import com.runarcana.nexus.inventory.service.ItemModelService;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ItemModelController.class)
class ItemModelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ItemModelService itemModelService;

    @TestConfiguration
    static class MapperConfig {
        @Bean
        InventoryMapper inventoryMapper() {
            return new InventoryMapper();
        }
    }

    @Test
    void shouldCreateItemModel() throws Exception {
        ItemModel item = new ItemModel();
        item.setName("Espada Longa");
        item.setItemType(ItemType.WEAPON);
        item.setWeight(new BigDecimal("1.2"));

        java.lang.reflect.Field idField = ItemModel.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(item, 10L);

        java.lang.reflect.Field createdAtField = ItemModel.class.getSuperclass().getDeclaredField("createdAt");
        createdAtField.setAccessible(true);
        createdAtField.set(item, Instant.now());

        java.lang.reflect.Field updatedAtField = ItemModel.class.getSuperclass().getDeclaredField("updatedAt");
        updatedAtField.setAccessible(true);
        updatedAtField.set(item, Instant.now());

        when(itemModelService.create(any(ItemModelRequest.class))).thenReturn(item);

        ItemModelRequest request = new ItemModelRequest("Espada Longa", null, ItemType.WEAPON, new BigDecimal("1.2"), null);

        mockMvc.perform(post("/api/v1/items")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.name").value("Espada Longa"));
    }
}
