package com.akatsuki.studypulse.mental;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class DocumentChunkerTest {

    private final DocumentChunker chunker = new DocumentChunker();

    @Test
    void keepsMarkdownSectionsAndSourceIdentifiers() {
        DocumentManifest manifest = new DocumentManifest("doc_1", "guide.md", "text/markdown", "sha256:x", 42);
        DocumentParser.ParsedDocument document = new DocumentParser.ParsedDocument(manifest,
                "Introduction\n\n# Payment\n\nPayment requires approval.\n\n## Refund\n\nRefund is limited.");

        List<DocumentChunk> chunks = chunker.chunk(document);

        assertEquals(3, chunks.size());
        assertEquals("Payment", chunks.get(1).heading());
        assertTrue(chunks.get(1).source().contains("guide.md#doc_1_chunk_2"));
    }
}
