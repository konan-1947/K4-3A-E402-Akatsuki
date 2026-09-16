package com.akatsuki.studypulse.config;

import com.akatsuki.studypulse.ai.AiClient;
import com.akatsuki.studypulse.ai.AiDiagnosticsListener;
import com.akatsuki.studypulse.ai.DeepSeekAdapter;
import com.akatsuki.studypulse.ai.DeepSeekDisableThinkingInterceptor;
import com.akatsuki.studypulse.ai.FallbackAiClient;
import com.akatsuki.studypulse.ai.OpenAiAdapter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.api.ResponseFormat;
import org.springframework.web.client.RestClient;

@Configuration
public class AiClientConfig {

    @Bean
    @Primary
    public AiClient aiClient(
            @Value("${app.ai.openai.api-key}") String openAiApiKey,
            @Value("${app.ai.openai.base-url}") String openAiBaseUrl,
            @Value("${app.ai.openai.default-model}") String openAiModel,
            @Value("${app.ai.deepseek.api-key}") String deepSeekApiKey,
            @Value("${app.ai.deepseek.base-url}") String deepSeekBaseUrl,
            @Value("${app.ai.deepseek.default-model}") String deepSeekModel,
            @Autowired(required = false) AiDiagnosticsListener diagnostics) {
        return fallbackClient(openAiApiKey, openAiBaseUrl, openAiModel,
                deepSeekApiKey, deepSeekBaseUrl, deepSeekModel, null, diagnostics);
    }

    /** Use this bean when a caller's prompt requires a JSON object response. */
    @Bean("jsonAiClient")
    public AiClient jsonAiClient(
            @Value("${app.ai.openai.api-key}") String openAiApiKey,
            @Value("${app.ai.openai.base-url}") String openAiBaseUrl,
            @Value("${app.ai.openai.default-model}") String openAiModel,
            @Value("${app.ai.deepseek.api-key}") String deepSeekApiKey,
            @Value("${app.ai.deepseek.base-url}") String deepSeekBaseUrl,
            @Value("${app.ai.deepseek.default-model}") String deepSeekModel,
            @Autowired(required = false) AiDiagnosticsListener diagnostics) {
        ResponseFormat format = ResponseFormat.builder().type(ResponseFormat.Type.JSON_OBJECT).build();
        return fallbackClient(openAiApiKey, openAiBaseUrl, openAiModel,
                deepSeekApiKey, deepSeekBaseUrl, deepSeekModel, format, diagnostics);
    }

    private AiClient fallbackClient(String openAiApiKey, String openAiBaseUrl, String openAiModel,
                                    String deepSeekApiKey, String deepSeekBaseUrl, String deepSeekModel,
                                    ResponseFormat responseFormat, AiDiagnosticsListener diagnostics) {
        OpenAiChatOptions.Builder deepSeekOptions = OpenAiChatOptions.builder()
                .model(deepSeekModel)
                .maxTokens(8192);
        OpenAiChatOptions.Builder openAiOptions = OpenAiChatOptions.builder()
                .model(openAiModel)
                .maxTokens(8192);
        if (responseFormat != null) {
            deepSeekOptions.responseFormat(responseFormat);
            openAiOptions.responseFormat(responseFormat);
        }

        OpenAiApi deepSeekApi = OpenAiApi.builder()
                .baseUrl(deepSeekBaseUrl)
                .apiKey(deepSeekApiKey)
                .restClientBuilder(RestClient.builder()
                        .requestInterceptor(new DeepSeekDisableThinkingInterceptor()))
                .build();
        OpenAiChatModel deepSeekModelClient = OpenAiChatModel.builder()
                .openAiApi(deepSeekApi)
                .defaultOptions(deepSeekOptions.build())
                .build();

        OpenAiApi openAiApi = OpenAiApi.builder()
                .baseUrl(openAiBaseUrl)
                .apiKey(openAiApiKey)
                .build();
        OpenAiChatModel openAiModelClient = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(openAiOptions.build())
                .build();

        return new FallbackAiClient(List.of(
                new DeepSeekAdapter(deepSeekModelClient),
                new OpenAiAdapter(openAiModelClient)), diagnostics);
    }
}
