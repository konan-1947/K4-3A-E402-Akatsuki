package com.akatsuki.studypulse.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;

class FallbackAiClientTest {

    @Test
    void returnsDeepSeekResultWithoutCallingFallback() {
        AiClient deepSeek = mock(AiClient.class);
        AiClient openAi = mock(AiClient.class);
        when(deepSeek.generate("hello")).thenReturn("deepseek result");

        String result = new FallbackAiClient(List.of(deepSeek, openAi)).generate("hello");

        assertEquals("deepseek result", result);
        verify(deepSeek).generate("hello");
        verifyNoInteractions(openAi);
    }

    @Test
    void usesOpenAiWhenDeepSeekFails() {
        AiClient deepSeek = mock(AiClient.class);
        AiClient openAi = mock(AiClient.class);
        when(deepSeek.generate("hello")).thenThrow(new RuntimeException("DeepSeek unavailable"));
        when(openAi.generate("hello")).thenReturn("openai result");

        String result = new FallbackAiClient(List.of(deepSeek, openAi)).generate("hello");

        assertEquals("openai result", result);
        verify(deepSeek).generate("hello");
        verify(openAi).generate("hello");
    }

    @Test
    void throwsWhenAllProvidersFail() {
        AiClient deepSeek = mock(AiClient.class);
        AiClient openAi = mock(AiClient.class);
        when(deepSeek.generate("hello")).thenThrow(new RuntimeException("DeepSeek unavailable"));
        when(openAi.generate("hello")).thenThrow(new RuntimeException("OpenAI unavailable"));

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> new FallbackAiClient(List.of(deepSeek, openAi)).generate("hello"));

        assertEquals("All AI providers failed", error.getMessage());
        verify(deepSeek).generate("hello");
        verify(openAi).generate("hello");
    }
}
