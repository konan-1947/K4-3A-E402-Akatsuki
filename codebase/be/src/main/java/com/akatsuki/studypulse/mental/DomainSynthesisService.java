package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DomainSynthesisService {

    private static final int MAX_INPUT_CHARS = 45000;
    private final AiJsonService ai;
    private final ObjectMapper mapper;

    public DomainSynthesisService(AiJsonService ai, ObjectMapper mapper) {
        this.ai = ai;
        this.mapper = mapper;
    }

    public List<JsonNode> synthesize(JsonNode normalizedFacts, String instruction) {
        Map<String, ArrayNode> groups = new LinkedHashMap<>();
        for (JsonNode factSet : normalizedFacts.path("fact_sets")) {
            JsonNode domains = factSet.path("suggested_domains");
            if (!domains.isArray() || domains.isEmpty()) {
                groups.computeIfAbsent("general", ignored -> mapper.createArrayNode()).add(factSet);
                continue;
            }
            for (JsonNode domain : domains) {
                String name = canonicalDomain(domain);
                groups.computeIfAbsent(name, ignored -> mapper.createArrayNode()).add(factSet);
            }
        }

        List<JsonNode> result = new ArrayList<>();
        for (Map.Entry<String, ArrayNode> entry : groups.entrySet()) {
            List<JsonNode> partials = new ArrayList<>();
            for (ArrayNode batch : batches(entry.getValue())) {
                partials.add(generate(entry.getKey(), batch, instruction));
            }
            result.add(partials.size() == 1 ? partials.get(0) : merge(entry.getKey(), partials, instruction));
        }
        return result;
    }

    private JsonNode generate(String domain, ArrayNode facts, String instruction) {
        String prompt = """
                Dựa trên facts có evidence bên dưới, hãy xây dựng domain model cho domain "%s".
                Chỉ sử dụng thông tin trong facts. Không tự bổ sung kiến thức bên ngoài.
                Trả về JSON object gồm: domain, purpose, entities, relationships,
                states_and_transitions, workflows, business_rules, ownership,
                dependencies, conflicts, assumptions, open_questions và evidence_map.
                Mỗi kết luận quan trọng phải có sources và status explicit hoặc inferred.
                Giữ output ngắn gọn: tối đa 12 items cho mỗi danh sách, không lặp lại nguyên văn facts.
                Không tự chọn một source khi có conflict.
                Định hướng người dùng: %s

                Facts:
                %s
                """.formatted(domain, instruction == null || instruction.isBlank() ? "Không có" : instruction,
                facts.toPrettyString());
        return ai.generate(prompt);
    }

    private static String canonicalDomain(JsonNode raw) {
        String value = raw.isObject()
                ? raw.path("domain").asText(raw.path("name").asText(""))
                : raw.asText("");
        String normalized = value.toLowerCase(Locale.ROOT).trim();
        if (containsAny(normalized, "permission", "quyền", "access", "scope", "auth", "security",
                "least", "confirm", "xác nhận", "audit", "bảo mật")) return "permissions-security";
        if (containsAny(normalized, "calendar", "lịch", "event", "meeting", "timezone", "availability")) return "calendar-workflow";
        if (containsAny(normalized, "request", "flow", "routing", "route", "validate", "result", "error", "tracing", "xử lý")) return "request-lifecycle";
        if (containsAny(normalized, "mcp", "server", "client", "tool", "resource", "prompt", "protocol")) return "mcp-architecture";
        if (containsAny(normalized, "user", "người dùng", "product", "sản phẩm", "goal", "mục tiêu", "document", "tài liệu")) return "product-context";
        return "general";
    }

    private static boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) if (value.contains(candidate)) return true;
        return false;
    }

    private JsonNode merge(String domain, List<JsonNode> partials, String instruction) {
        String prompt = """
                Hợp nhất các domain model từng phần thành một domain model duy nhất cho "%s".
                Giữ lại tất cả evidence, conflict, assumption và open question.
                Không tạo claim mới ngoài các model đầu vào. Trả về JSON object với các field:
                domain, purpose, entities, relationships, states_and_transitions, workflows,
                business_rules, ownership, dependencies, conflicts, assumptions,
                open_questions và evidence_map.
                Định hướng người dùng: %s

                Partial models:
                %s
                """.formatted(domain, instruction == null || instruction.isBlank() ? "Không có" : instruction,
                mapper.valueToTree(partials).toPrettyString());
        return ai.generate(prompt);
    }

    private List<ArrayNode> batches(ArrayNode source) {
        List<ArrayNode> result = new ArrayList<>();
        ArrayNode current = mapper.createArrayNode();
        int chars = 0;
        for (JsonNode item : source) {
            int size = item.toString().length();
            if (current.size() > 0 && chars + size > MAX_INPUT_CHARS) {
                result.add(current);
                current = mapper.createArrayNode();
                chars = 0;
            }
            current.add(item);
            chars += size;
        }
        if (current.size() > 0) result.add(current);
        return result;
    }
}
