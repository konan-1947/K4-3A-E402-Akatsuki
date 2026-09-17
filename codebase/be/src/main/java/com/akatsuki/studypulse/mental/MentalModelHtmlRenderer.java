package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class MentalModelHtmlRenderer {

    public String render(JsonNode model) {
        StringBuilder html = new StringBuilder();
        appendField(html, "title", model.path("title").asText());
        appendField(html, "scope", model.path("scope").asText());
        appendField(html, "purpose", model.path("purpose").asText());
        appendField(html, "oneSentence", model.path("oneSentence").asText());
        appendField(html, "core_idea", model.path("core_idea").asText());
        appendField(html, "explanation", model.path("explanation").asText());
        appendList(html, "Actors", model.path("actors"));
        appendList(html, "Thành phần chính", model.path("core_entities"));
        appendList(html, "Quan hệ", model.path("entity_relationships"));
        appendMechanism(html, model.path("causal_mechanism"));
        appendWorkflows(html, model.path("main_workflows"));
        appendList(html, "Chuyển trạng thái", model.path("state_transitions"));
        appendRules(html, model.path("business_rules"));
        appendList(html, "Giới hạn", model.path("boundaries"));
        appendList(html, "Hệ thống bên ngoài", model.path("external_systems"));
        appendList(html, "Mâu thuẫn", model.path("contradictions"));
        appendList(html, "Giả định", model.path("assumptions"));
        appendList(html, "Câu hỏi mở", model.path("open_questions"));
        if (html.isEmpty()) return "<p>Chưa có nội dung mental model để hiển thị.</p>";
        return html.toString();
    }

    private static void appendField(StringBuilder html, String key, String value) {
        if (value == null || value.isBlank()) return;
        String label = switch (key) {
            case "oneSentence" -> "Mental model";
            case "scope" -> "Phạm vi";
            case "purpose" -> "Mục đích";
            case "core_idea" -> "Ý tưởng trung tâm";
            case "explanation" -> "Giải thích";
            default -> "";
        };
        html.append(key.equals("title") ? "<h2>" : "<p><strong>" + label + ":</strong> ")
                .append(escape(value))
                .append(key.equals("title") ? "</h2>" : "</p>");
    }

    private static void appendList(StringBuilder html, String heading, JsonNode values) {
        if (!values.isArray() || values.isEmpty()) return;
        html.append("<h3>").append(escape(heading)).append("</h3><ul>");
        values.forEach(value -> {
            if (value.isTextual()) {
                html.append("<li>").append(escape(value.asText())).append("</li>");
                return;
            }
            String text = firstText(value, "name", "title", "statement", "condition", "description", "entity", "actor", "from");
            String relation = firstText(value, "relation", "relationship", "to", "then", "status", "type");
            if (!text.isBlank()) {
                html.append("<li>").append(escape(text));
                if (!relation.isBlank()) html.append(" <span>→ ").append(escape(relation)).append("</span>");
                html.append("</li>");
            }
        });
        html.append("</ul>");
    }

    private static void appendMechanism(StringBuilder html, JsonNode values) {
        if (!values.isArray() || values.isEmpty()) return;
        html.append("<h3>Cơ chế hoạt động</h3><ol>");
        values.forEach(value -> {
            if (value.isTextual()) {
                html.append("<li>").append(escape(value.asText())).append("</li>");
                return;
            }
            String when = firstText(value, "when");
            String then = firstText(value, "then", "result");
            String because = firstText(value, "because", "cause");
            String description = firstText(value, "description", "statement");
            String text = description.isBlank() ? when : description;
            if (!text.isBlank()) {
                html.append("<li>").append(escape(text));
                if (!then.isBlank()) html.append(" → ").append(escape(then));
                if (!because.isBlank()) html.append(" <em>(vì ").append(escape(because)).append(")</em>");
                html.append("</li>");
            }
        });
        html.append("</ol>");
    }


    private static void appendWorkflows(StringBuilder html, JsonNode values) {
        if (!values.isArray() || values.isEmpty()) return;
        html.append("<h3>Luồng hoạt động</h3><ul>");
        values.forEach(value -> {
            if (value.isObject()) {
                html.append("<li>");
                String name = firstText(value, "name", "title");
                if (!name.isBlank()) html.append("<strong>").append(escape(name)).append("</strong>");
                String description = firstText(value, "description");
                if (!description.isBlank()) html.append("<p>").append(escape(description)).append("</p>");
                JsonNode steps = value.path("steps");
                if (steps.isArray() && !steps.isEmpty()) {
                    html.append("<ol>");
                    steps.forEach(step -> html.append("<li>").append(escape(step.isTextual()
                            ? step.asText() : firstText(step, "name", "description"))).append("</li>"));
                    html.append("</ol>");
                }
                html.append("</li>");
            } else {
                html.append("<li>").append(escape(value.asText())).append("</li>");
            }
        });
        html.append("</ul>");
    }

    private static void appendRules(StringBuilder html, JsonNode values) {
        if (!values.isArray() || values.isEmpty()) return;
        html.append("<h3>Điểm cần nhớ</h3><ul>");
        values.forEach(value -> {
            String rule = value.isObject() ? firstText(value, "rule", "description", "name") : value.asText();
            if (!rule.isBlank()) html.append("<li>").append(escape(rule)).append("</li>");
        });
        html.append("</ul>");
    }

    private static String firstText(JsonNode value, String... keys) {
        for (String key : keys) {
            String text = value.path(key).asText("").trim();
            if (!text.isBlank()) return text;
        }
        return "";
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
