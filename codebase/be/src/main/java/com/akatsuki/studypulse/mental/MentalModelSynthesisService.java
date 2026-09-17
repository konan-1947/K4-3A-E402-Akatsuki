package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class MentalModelSynthesisService {

    private final AiJsonService ai;
    private final ObjectMapper mapper;

    public MentalModelSynthesisService(AiJsonService ai, ObjectMapper mapper) {
        this.ai = ai;
        this.mapper = mapper;
    }

    public JsonNode synthesize(Iterable<JsonNode> domainModels, JsonNode conflicts, String instruction) {
        String prompt = """
                Hãy xây dựng một mental model thuần túy từ các domain models và conflicts bên dưới.
                Đây là bản đồ kiến thức có căn cứ nguồn, không phải lesson plan hay nội dung bài giảng.
                Không điền khoảng trống bằng kiến thức bên ngoài và không loại bỏ conflict.
                Trả về JSON object gồm các nhóm thông tin sau:
                title, scope, purpose, oneSentence, explanation, core_idea,
                causal_mechanism, components, actors, core_entities,
                entity_relationships, main_workflows, state_transitions, business_rules,
                ownership_and_dependencies, external_systems, boundaries,
                contradictions, assumptions, open_questions, citations và evidence_map.

                Hãy mô tả cấu trúc của hệ thống và quan hệ nhân-quả giữa các thành phần.
                scope phải nêu phạm vi được mô hình hóa và những gì nằm ngoài phạm vi.
                purpose phải mô tả mục đích/chức năng của hệ thống hoặc concept.
                causal_mechanism phải mô tả dạng "khi ... thì ... vì ...".
                Mỗi causal_mechanism là object gồm when, then và because.
                boundaries là các điều kiện, giới hạn hoặc trường hợp không áp dụng.

                Nội dung giải thích (oneSentence, explanation và core_idea) phải rõ ràng,
                không chèn source id, status hay metadata kỹ thuật vào câu văn.
                Các claim quan trọng vẫn phải có sources và status explicit hoặc inferred
                trong các field dữ liệu hỗ trợ/citation.
                Không tạo ví dụ, câu hỏi kiểm tra, mục tiêu học, prerequisites, analogy,
                misconception, feedback hoặc nhiệm vụ áp dụng; các nội dung đó sẽ được
                sinh ở bước lesson blueprint.
                Giữ output súc tích: tối đa 5 workflows, 10 entities, 12 relationships
                và 10 rules; không lặp lại nguyên văn domain models.
                Định hướng người dùng: %s

                Domain models:
                %s

                Conflicts:
                %s
                """.formatted(instruction == null || instruction.isBlank() ? "Không có" : instruction,
                mapper.valueToTree(domainModels).toPrettyString(), conflicts.toPrettyString());
        return ai.generate(prompt);
    }
}
