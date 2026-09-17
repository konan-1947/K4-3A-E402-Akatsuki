package com.akatsuki.studypulse.blueprint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.stereotype.Service;

/** Deterministic gate for drafts and approval.  It intentionally accepts warnings separately. */
@Service
public class BlueprintValidator {
    private final ObjectMapper mapper;
    public BlueprintValidator(ObjectMapper mapper) { this.mapper = mapper; }

    public JsonNode validate(JsonNode blueprint, Set<String> validConcepts, Set<String> validChunks) {
        var errors = mapper.createArrayNode(); var warnings = mapper.createArrayNode();
        Map<String, JsonNode> blocks = new LinkedHashMap<>();
        for (JsonNode b : blueprint.path("blocks")) {
            String id = b.path("id").asText();
            if (id.isBlank() || blocks.putIfAbsent(id, b) != null) errors.add("Block id missing or duplicated: " + id);
            JsonNode brief = b.path("content_brief");
            if (brief.path("overview").asText().isBlank()) errors.add("Block needs a detailed content brief: " + id);
            for (JsonNode c : b.path("concept_ids")) if (!validConcepts.contains(c.asText())) errors.add("Unknown concept " + c.asText());
            for (JsonNode r : b.path("resource_plan")) if ("source_excerpt".equals(r.path("type").asText()) && !validChunks.contains(r.path("chunk_id").asText())) errors.add("Unknown source chunk " + r.path("chunk_id").asText());
        }
        Set<String> covered = new HashSet<>(); blocks.values().forEach(b -> b.path("concept_ids").forEach(c -> covered.add(c.asText())));
        validConcepts.forEach(c -> { if (!covered.contains(c)) errors.add("Core concept is not covered: " + c); });
        Map<String, List<String>> requires = new HashMap<>();
        for (JsonNode e : blueprint.path("edges")) {
            String from = e.path("from").asText(), to = e.path("to").asText();
            if (!blocks.containsKey(from) || !blocks.containsKey(to)) errors.add("Edge references missing block");
            if ("requires".equals(e.path("type").asText())) requires.computeIfAbsent(to, x -> new ArrayList<>()).add(from);
        }
        if (hasCycle(requires, blocks.keySet())) errors.add("Learning graph has a requires cycle");
        for (JsonNode b : blocks.values()) {
            String type = b.path("type").asText();
            if ("checkpoint".equals(type) && b.path("concept_ids").isEmpty()) warnings.add("Checkpoint has no assessed concepts");
            if ("transfer_task".equals(type) && requires.getOrDefault(b.path("id").asText(), List.of()).isEmpty()) errors.add("Transfer task needs a prerequisite practice block");
        }
        var report = mapper.createObjectNode(); report.set("errors", errors); report.set("warnings", warnings); report.put("valid", errors.isEmpty()); return report;
    }
    private boolean hasCycle(Map<String, List<String>> graph, Set<String> nodes) { Set<String> seen = new HashSet<>(), visiting = new HashSet<>(); for (String n:nodes) if (visit(n,graph,seen,visiting)) return true; return false; }
    private boolean visit(String n, Map<String,List<String>> g, Set<String> seen, Set<String> visiting) { if (visiting.contains(n)) return true; if (!seen.add(n)) return false; visiting.add(n); for(String p:g.getOrDefault(n,List.of())) if(visit(p,g,seen,visiting)) return true; visiting.remove(n); return false; }
}
