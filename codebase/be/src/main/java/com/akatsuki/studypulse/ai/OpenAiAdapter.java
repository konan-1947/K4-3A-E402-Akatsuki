package com.akatsuki.studypulse.ai;

import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

public class OpenAiAdapter implements AiClient {

    private final ChatModel chatModel;

    public OpenAiAdapter(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public String generate(String prompt) {
        return chatModel.call(new Prompt(prompt)).getResult().getOutput().getText();
    }

    @Override
    public String generate(String prompt, byte[] image, String mimeType) {
        MimeType mediaType = mimeType == null || mimeType.isBlank()
                ? MimeTypeUtils.IMAGE_JPEG
                : MimeType.valueOf(mimeType);
        Media media = Media.builder().mimeType(mediaType).data(image).build();
        UserMessage message = UserMessage.builder().text(prompt).media(media).build();
        return chatModel.call(new Prompt(message)).getResult().getOutput().getText();
    }
}
