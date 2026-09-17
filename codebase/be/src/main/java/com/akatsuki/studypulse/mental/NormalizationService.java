package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class NormalizationService {

    private static final Map<String, String> SYNONYMS = Map.of(
            "customer", "User", "client", "User", "user", "User",
            "purchase", "Order", "order", "Order",
            "payment", "Payment", "refund", "Refund");

    private final ObjectMapper mapper;

    public NormalizationService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public JsonNode normalize(List<FactSet> factSets) {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode normalized = root.putArray("fact_sets");
        Map<String, String> glossary = new LinkedHashMap<>();
        for (FactSet factSet : factSets) {
            JsonNode copy = factSet.data().deepCopy();
            canonicalize(copy, glossary);
            normalized.add(copy);
        }
        ObjectNode glossaryNode = root.putObject("glossary");
        glossary.forEach(glossaryNode::put);
        return root;
    }

    private static void canonicalize(JsonNode node, Map<String, String> glossary) {
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                JsonNode value = entry.getValue();
                if (value.isTextual() && isNameField(key)) {
                    String canonical = canonical(value.textValue());
                    if (!canonical.equals(value.textValue())) {
                        ((ObjectNode) node).put(key, canonical);
                        glossary.put(value.textValue(), canonical);
                    }
                } else {
                    canonicalize(value, glossary);
                }
            });
        } else if (node.isArray()) {
            node.forEach(child -> canonicalize(child, glossary));
        }
    }

    private static boolean isNameField(String key) {
        return key.equals("name") || key.equals("from") || key.equals("to") || key.equals("entity")
                || key.equals("actor") || key.equals("owner");
    }

    private static String canonical(String value) {
        String synonym = SYNONYMS.get(value.trim().toLowerCase(Locale.ROOT));
        return synonym == null ? value.trim() : synonym;
    }
}
