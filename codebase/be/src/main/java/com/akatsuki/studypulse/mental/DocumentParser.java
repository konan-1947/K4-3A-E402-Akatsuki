package com.akatsuki.studypulse.mental;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Component;
import org.xml.sax.ContentHandler;
import org.xml.sax.helpers.DefaultHandler;
import org.apache.tika.parser.ParseContext;

/** Converts supported office/PDF/text files into searchable plain text. */
@Component
public class DocumentParser {

    private final AutoDetectParser parser = new AutoDetectParser();

    public ParsedDocument parse(DocumentManifest manifest, byte[] bytes) {
        try {
            Metadata metadata = new Metadata();
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, manifest.fileName());
            ContentHandler handler = new BodyContentHandler(-1);
            parser.parse(new ByteArrayInputStream(bytes), handler, metadata, new ParseContext());
            String text = normalize(handler.toString());
            if (text.isBlank()) {
                throw new IllegalArgumentException("No readable text found");
            }
            return new ParsedDocument(manifest, text);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Cannot parse " + manifest.fileName() + ": " + exception.getMessage(), exception);
        }
    }

    private static String normalize(String value) {
        return value.replace("\u0000", "")
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[ \t]+\n", "\n")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }

    public record ParsedDocument(DocumentManifest manifest, String text) { }
}
