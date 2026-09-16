package com.akatsuki.studypulse.ai;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;

class DeepSeekAdapterTest {

    @Test
    void rejectsImageInput() {
        DeepSeekAdapter adapter = new DeepSeekAdapter(mock(ChatModel.class));

        assertThrows(UnsupportedOperationException.class,
                () -> adapter.generate("describe this", new byte[] {1}, "image/png"));
    }
}
