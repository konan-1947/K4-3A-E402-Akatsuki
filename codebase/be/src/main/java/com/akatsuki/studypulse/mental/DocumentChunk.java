package com.akatsuki.studypulse.mental;

public record DocumentChunk(
        String chunkId,
        String documentId,
        String fileName,
        String heading,
        String text,
        String source
) { }
