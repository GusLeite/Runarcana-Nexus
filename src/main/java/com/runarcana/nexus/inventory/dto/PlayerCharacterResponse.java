package com.runarcana.nexus.inventory.dto;

import java.time.Instant;

public record PlayerCharacterResponse(Long id, String name, Instant createdAt, Instant updatedAt) {
}
