package com.akatsuki.studypulse.mental;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class DomainSynthesisServiceTest {

    @Test
    void collapsesObjectDomainLabelsIntoOneCanonicalGroup() {
        ObjectMapper mapper = new ObjectMapper();
        AiJsonService ai = mock(AiJsonService.class);
        when(ai.generate(anyString())).thenReturn(mapper.createObjectNode().put("domain", "mcp-architecture"));
        ObjectNode normalized = mapper.createObjectNode();
        ObjectNode factSet = normalized.putArray("fact_sets").addObject();
        factSet.putArray("suggested_domains").addObject().put("domain", "MCP");
        factSet.withArray("suggested_domains").addObject().put("domain", "server");

        var models = new DomainSynthesisService(ai, mapper).synthesize(normalized, "");

        assertEquals(1, models.size());
    }
}
