package com.akatsuki.studypulse.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

/** Adds DeepSeek's non-standard flag that disables reasoning-mode output. */
public class DeepSeekDisableThinkingInterceptor implements ClientHttpRequestInterceptor {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        JsonNode root = MAPPER.readTree(body);
        byte[] patchedBody = body;
        if (root instanceof ObjectNode objectNode) {
            objectNode.putObject("thinking").put("type", "disabled");
            patchedBody = MAPPER.writeValueAsBytes(objectNode);
        }
        return execution.execute(request, patchedBody);
    }
}
