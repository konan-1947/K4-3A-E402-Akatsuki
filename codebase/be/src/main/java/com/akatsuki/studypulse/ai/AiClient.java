package com.akatsuki.studypulse.ai;

/** Provider-neutral boundary for every call to a generative AI model. */
public interface AiClient {

    String generate(String prompt);

    String generate(String prompt, byte[] image, String mimeType);
}
