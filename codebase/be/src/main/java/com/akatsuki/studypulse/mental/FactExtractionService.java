package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import org.springframework.stereotype.Service;

@Service
public class FactExtractionService {

    private final AiJsonService ai;

    public FactExtractionService(AiJsonService ai) {
        this.ai = ai;
    }

    public List<FactSet> extract(List<DocumentChunk> chunks, String topicInstruction) {
        return extract(chunks, topicInstruction, (completed, total) -> { });
    }

    public List<FactSet> extract(
            List<DocumentChunk> chunks,
            String topicInstruction,
            BiConsumer<Integer, Integer> progress) {
        List<FactSet> result = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            String prompt = """
                    Bạn là một evidence extraction engine.

                    Chỉ lấy thông tin có trong nội dung nguồn, không tự bổ sung.
                    Trích xuất JSON với các field:
                    entities, relationships, states, workflows, rules, ownership,
                    assumptions, open_questions, conflicts, suggested_domains.
                    Mỗi item phải có source là %s và status explicit hoặc inferred.
                    Giữ nguyên điều kiện, ngoại lệ và trạng thái. Không hòa giải conflict.
                    Nếu không có dữ liệu cho field nào, trả về mảng rỗng.
                    suggested_domains là tối đa 2 nhãn domain lớn, phải là plain string,
                    không phải object. Chỉ dùng một trong các nhóm: mcp-architecture,
                    request-lifecycle, permissions-security, calendar-workflow,
                    product-context, general.
                    Chỉ trả về JSON object.

                    Định hướng thêm của người dùng: %s
                    File: %s
                    Section: %s
                    Source: %s

                    Nội dung:
                    %s
                    """.formatted(chunk.source(), blankAsDefault(topicInstruction), chunk.fileName(),
                    chunk.heading(), chunk.source(), chunk.text());
            JsonNode data = ai.generate(prompt);
            ObjectNode object = data.isObject() ? (ObjectNode) data.deepCopy() : new ObjectNode(aiMapper(data));
            object.put("chunk_id", chunk.chunkId());
            object.put("source_document", chunk.documentId());
            ensureArray(object, "entities");
            ensureArray(object, "relationships");
            ensureArray(object, "states");
            ensureArray(object, "workflows");
            ensureArray(object, "rules");
            ensureArray(object, "ownership");
            ensureArray(object, "assumptions");
            ensureArray(object, "open_questions");
            ensureArray(object, "conflicts");
            ensureArray(object, "suggested_domains");
            result.add(new FactSet(chunk.chunkId(), object));
            progress.accept(result.size(), chunks.size());
        }
        return result;
    }

    private static String blankAsDefault(String value) {
        return value == null || value.isBlank() ? "Không có" : value;
    }

    private static void ensureArray(ObjectNode object, String field) {
        if (!object.has(field) || !object.get(field).isArray()) object.set(field, object.arrayNode());
    }

    private static com.fasterxml.jackson.databind.node.JsonNodeFactory aiMapper(JsonNode ignored) {
        return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance;
    }
}
