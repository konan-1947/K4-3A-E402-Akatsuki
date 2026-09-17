package com.akatsuki.studypulse.mental;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class NormalizationServiceTest {

    @Test
    void canonicalizesCommonEntityAliasesAndPreservesFacts() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode data = mapper.createObjectNode();
        data.putArray("suggested_domains").add("commerce");
        data.putArray("entities").addObject().put("name", "customer");
        data.putArray("relationships").addObject().put("from", "customer").put("relation", "creates").put("to", "purchase");

        var normalized = new NormalizationService(mapper).normalize(List.of(new FactSet("chunk-1", data)));

        assertEquals("User", normalized.path("fact_sets").path(0).path("entities").path(0).path("name").asText());
        assertEquals("Order", normalized.path("fact_sets").path(0).path("relationships").path(0).path("to").asText());
        assertEquals("User", normalized.path("glossary").path("customer").asText());
    }
}
