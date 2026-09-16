package com.akatsuki.studypulse.ai;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClientResponseException;

/** Tries providers in order: DeepSeek first, then OpenAI when it fails. */
public class FallbackAiClient implements AiClient {

    private static final Logger LOG = LoggerFactory.getLogger(FallbackAiClient.class);

    private final List<AiClient> clients;
    private final AiDiagnosticsListener diagnostics;

    public FallbackAiClient(List<AiClient> clients) {
        this(clients, AiDiagnosticsListener.NO_OP);
    }

    public FallbackAiClient(List<AiClient> clients, AiDiagnosticsListener diagnostics) {
        if (clients == null || clients.isEmpty()) {
            throw new IllegalArgumentException("At least one AI provider is required");
        }
        this.clients = List.copyOf(clients);
        this.diagnostics = diagnostics == null ? AiDiagnosticsListener.NO_OP : diagnostics;
    }

    @Override
    public String generate(String prompt) {
        return execute(client -> client.generate(prompt));
    }

    @Override
    public String generate(String prompt, byte[] image, String mimeType) {
        return execute(client -> client.generate(prompt, image, mimeType));
    }

    private String execute(AiOperation operation) {
        Exception lastException = null;
        for (AiClient client : clients) {
            String provider = client.getClass().getSimpleName();
            diagnostics.onProviderAttempt(provider);
            try {
                String result = operation.apply(client);
                diagnostics.onProviderSucceeded(provider);
                LOG.info("AI call succeeded provider={}", provider);
                return result;
            } catch (Exception exception) {
                LOG.warn("AI call failed provider={} httpStatus={} detail={}", provider,
                        httpStatus(exception), rootMessage(exception));
                diagnostics.onProviderFailed(provider, exception.getMessage());
                lastException = exception;
            }
        }
        throw new RuntimeException("All AI providers failed", lastException);
    }

    private static String httpStatus(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof RestClientResponseException responseException) {
                return String.valueOf(responseException.getStatusCode().value());
            }
        }
        return "n/a";
    }

    private static String rootMessage(Throwable error) {
        Throwable root = error;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String message = root.getMessage();
        return message == null || message.isBlank() ? root.getClass().getSimpleName() : message;
    }

    @FunctionalInterface
    private interface AiOperation {
        String apply(AiClient client) throws Exception;
    }
}
