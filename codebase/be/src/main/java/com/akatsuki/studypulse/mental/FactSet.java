package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;

public record FactSet(String chunkId, JsonNode data) { }
