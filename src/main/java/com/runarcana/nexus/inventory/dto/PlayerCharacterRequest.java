package com.runarcana.nexus.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PlayerCharacterRequest(@NotBlank @Size(max = 120) String name) {
}
