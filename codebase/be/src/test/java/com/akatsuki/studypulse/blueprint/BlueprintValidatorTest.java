package com.akatsuki.studypulse.blueprint;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BlueprintValidatorTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final BlueprintValidator validator = new BlueprintValidator(mapper);

    @Test
    void acceptsDetailedSingleEditorBrief() {
        ObjectNode blueprint = baseBlock("sequence");
        ((ObjectNode) blueprint.withArray("blocks").get(0)).with("content_brief").put("overview", "Phần này giải thích luồng. Diagram cần tạo: User -> client -> server.");

        assertTrue(validator.validate(blueprint, Set.of("concept_1"), Set.of()).path("valid").asBoolean());
    }

    @Test
    void rejectsMissingSingleEditorBrief() {
        ObjectNode blueprint = baseBlock("simulation");
        ((ObjectNode) blueprint.withArray("blocks").get(0)).with("content_brief").put("overview", "");

        assertFalse(validator.validate(blueprint, Set.of("concept_1"), Set.of()).path("valid").asBoolean());
    }

    private ObjectNode baseBlock(String type) {
        ObjectNode blueprint = mapper.createObjectNode();
        ObjectNode block = blueprint.putArray("blocks").addObject();
        block.put("id", "block_1").put("type", type);
        block.putArray("concept_ids").add("concept_1");
        block.putArray("resource_plan");
        block.putObject("content_brief").put("overview", "This section explains the concept.")
            .putArray("writing_outline").add("Introduce the concept").add("Show its consequence");
        blueprint.putArray("edges");
        return blueprint;
    }
}
