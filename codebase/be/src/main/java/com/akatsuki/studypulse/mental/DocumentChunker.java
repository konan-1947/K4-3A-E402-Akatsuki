package com.akatsuki.studypulse.mental;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class DocumentChunker {

    private static final int MAX_CHARS = 12000;
    private static final Pattern HEADING = Pattern.compile("(?m)^(#{1,6}\\s+.+)$");

    public List<DocumentChunk> chunk(DocumentParser.ParsedDocument document) {
        List<Section> sections = sections(document.text());
        List<DocumentChunk> result = new ArrayList<>();
        int number = 1;
        for (Section section : sections) {
            for (String piece : splitLarge(section.text())) {
                String chunkId = document.manifest().documentId() + "_chunk_" + number++;
                result.add(new DocumentChunk(chunkId, document.manifest().documentId(),
                        document.manifest().fileName(), section.heading(), piece,
                        document.manifest().fileName() + "#" + chunkId));
            }
        }
        return result;
    }

    private static List<Section> sections(String text) {
        List<Section> result = new ArrayList<>();
        Matcher matcher = HEADING.matcher(text);
        int cursor = 0;
        String heading = "Document introduction";
        while (matcher.find()) {
            String before = text.substring(cursor, matcher.start()).trim();
            if (!before.isBlank()) result.add(new Section(heading, before));
            heading = matcher.group(1).replaceFirst("^#{1,6}\\s+", "").trim();
            cursor = matcher.end();
        }
        String tail = text.substring(cursor).trim();
        if (!tail.isBlank()) result.add(new Section(heading, tail));
        return result.isEmpty() ? List.of(new Section(heading, text)) : result;
    }

    private static List<String> splitLarge(String text) {
        if (text.length() <= MAX_CHARS) return List.of(text);
        List<String> result = new ArrayList<>();
        String[] paragraphs = text.split("\\n\\s*\\n");
        StringBuilder current = new StringBuilder();
        for (String paragraph : paragraphs) {
            if (current.length() > 0 && current.length() + paragraph.length() + 2 > MAX_CHARS) {
                result.add(current.toString().trim());
                current.setLength(0);
            }
            if (current.length() > 0) current.append("\n\n");
            current.append(paragraph);
        }
        if (current.length() > 0) result.add(current.toString().trim());
        return result;
    }

    private record Section(String heading, String text) { }
}
