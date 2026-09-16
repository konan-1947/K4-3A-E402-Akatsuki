package com.akatsuki.studypulse.ai;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;

public class DeepSeekAdapter implements AiClient {

    private final ChatModel chatModel;

    public DeepSeekAdapter(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public String generate(String prompt) {
        return chatModel.call(new Prompt(prompt)).getResult().getOutput().getText();
    }

    @Override
    public String generate(String prompt, byte[] image, String mimeType) {
        throw new UnsupportedOperationException("DeepSeek does not support image input");
    }
}
