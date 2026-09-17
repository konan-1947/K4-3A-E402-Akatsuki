package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class MentalModelValidator {

    private final ObjectMapper mapper;

    public MentalModelValidator(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public JsonNode validate(JsonNode model, JsonNode normalizedFacts) {
        ObjectNode report = mapper.createObjectNode();
        ArrayNode errors = report.putArray("errors");
        ArrayNode warnings = report.putArray("warnings");
        Set<String> knownChunks = new HashSet<>();
        for (JsonNode factSet : normalizedFacts.path("fact_sets")) {
            if (factSet.hasNonNull("chunk_id")) knownChunks.add(factSet.get("chunk_id").asText());
        }

        if (!model.isObject()) errors.add("mentalModel must be a JSON object");
        if (model.path("title").asText().isBlank()) warnings.add("Missing title");
        if (model.path("oneSentence").asText().isBlank()) warnings.add("Missing oneSentence");
        if (model.path("scope").asText().isBlank()) warnings.add("Missing scope");
        if (!model.path("core_entities").isArray()) warnings.add("Missing core_entities");
        if (!model.path("causal_mechanism").isArray()) warnings.add("Missing causal_mechanism");
        if (!model.path("citations").isArray() && !model.path("evidence_map").isObject()) {
            warnings.add("No citations or evidence_map found");
        }
        inspectSources(model, knownChunks, errors, warnings);
        report.put("valid", errors.isEmpty());
        report.put("knownChunkCount", knownChunks.size());
        return report;
    }

    private void inspectSources(JsonNode node, Set<String> knownChunks, ArrayNode errors, ArrayNode warnings) {
        if (node.isObject()) {
            Iterator<String> names = node.fieldNames();
            while (names.hasNext()) {
                String name = names.next();
                JsonNode value = node.get(name);
                if ((name.equals("source") || name.equals("sources")) && value.isTextual()
                        && !value.asText().isBlank() && !knownChunks.isEmpty()
                        && knownChunks.stream().noneMatch(value.asText()::contains)) {
                    warnings.add("Unknown source: " + value.asText());
                }
                inspectSources(value, knownChunks, errors, warnings);
            }
        } else if (node.isArray()) {
            node.forEach(child -> inspectSources(child, knownChunks, errors, warnings));
        }
    }
}
