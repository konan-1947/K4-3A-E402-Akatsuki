package com.akatsuki.studypulse.mental;

import com.akatsuki.studypulse.ai.AiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class AiJsonService {

    private final AiClient client;
    private final ObjectMapper mapper;

    public AiJsonService(@Qualifier("jsonAiClient") AiClient client, ObjectMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    public JsonNode generate(String prompt) {
        String raw = client.generate(prompt);
        try {
            return parse(raw);
        } catch (Exception firstFailure) {
            String repaired = client.generate("Sửa output sau thành một JSON hợp lệ. Chỉ trả JSON, không markdown hay giải thích.\n\n" + raw);
            try {
                return parse(repaired);
            } catch (Exception secondFailure) {
                throw new IllegalStateException("AI returned invalid JSON after retry", secondFailure);
            }
        }
    }

    private JsonNode parse(String raw) throws Exception {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("Empty AI response");
        String candidate = raw.trim();
        if (candidate.startsWith("```")) {
            candidate = candidate.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
        }
        int objectStart = candidate.indexOf('{');
        int arrayStart = candidate.indexOf('[');
        int start = objectStart < 0 ? arrayStart : arrayStart < 0 ? objectStart : Math.min(objectStart, arrayStart);
        if (start > 0) candidate = candidate.substring(start);
        return mapper.readTree(candidate);
    }
}
