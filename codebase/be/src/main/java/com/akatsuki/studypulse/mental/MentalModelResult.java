package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;

public record MentalModelResult(
        String runId,
        JsonNode mentalModel,
        String renderedHtml,
        JsonNode validation
) { }
