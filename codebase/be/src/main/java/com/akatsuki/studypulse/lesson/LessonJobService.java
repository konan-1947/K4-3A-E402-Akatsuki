package com.akatsuki.studypulse.lesson;

import com.akatsuki.studypulse.mental.AiJsonService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LessonJobService {
    private final Executor executor;
    private final Path runs;
    private final ObjectMapper mapper;
    private final AiJsonService ai;
    private final ConcurrentHashMap<String, Job> jobs = new ConcurrentHashMap<>();

    public LessonJobService(@Qualifier("mentalModelTaskExecutor") Executor executor,
                            @Value("${app.mental-model.runs-dir:runs}") String runs,
                            ObjectMapper mapper, AiJsonService ai) {
        this.executor = executor;
        this.runs = Path.of(runs);
        this.mapper = mapper;
        this.ai = ai;
    }

    public synchronized Status create(String runId) throws IOException {
        if (!Files.exists(runs.resolve(runId).resolve("blueprint/blueprint-approved.json"))) {
            throw new IllegalStateException("Approve the blueprint before creating a lesson");
        }
        Job previous = jobs.get(runId);
        if (previous != null && previous.running()) throw new IllegalStateException("A lesson job is already active");
        Job job = new Job(runId);
        jobs.put(runId, job);
        executor.execute(() -> process(job));
        return job.status();
    }

    public Status status(String runId) throws IOException {
        Job active = jobs.get(runId);
        if (active != null) return active.status();
        Path file = lessonDir(runId).resolve("status.json");
        if (Files.exists(file)) return mapper.readValue(Files.readString(file), Status.class);
        throw new IllegalArgumentException("No lesson job for run " + runId);
    }

    public JsonNode draft(String runId) throws IOException {
        Path file = lessonDir(runId).resolve("lesson-draft.json");
        if (!Files.exists(file)) throw new IllegalArgumentException("Lesson draft has not been generated yet");
        return mapper.readTree(Files.readString(file));
    }

    private void process(Job job) {
        try {
            job.update("READING_BLUEPRINT");
            JsonNode approved = mapper.readTree(Files.readString(runs.resolve(job.runId).resolve("blueprint/blueprint-approved.json")));
            JsonNode blueprint = approved.path("blueprint");
            job.update("WRITING_LESSON_METADATA");
            JsonNode lesson = generateInParts(blueprint, job);
            job.update("VALIDATING_ASSETS");
            lesson = normalize(lesson, blueprint);
            Path directory = lessonDir(job.runId);
            Files.createDirectories(directory);
            write(directory.resolve("lesson-draft.json"), lesson);
            job.done();
            write(directory.resolve("status.json"), job.status());
        } catch (Exception error) {
            job.fail(error.getMessage());
            try {
                Files.createDirectories(lessonDir(job.runId));
                write(lessonDir(job.runId).resolve("status.json"), job.status());
            } catch (Exception ignored) { }
        }
    }

    private JsonNode generateInParts(JsonNode blueprint, Job job) {
        ObjectNode lesson = mapper.createObjectNode();
        ArrayNode warnings = lesson.putArray("warnings");
        try {
            JsonNode metadata = ai.generate(metadataPrompt(blueprint));
            lesson.put("title", metadata.path("title").asText());
            lesson.put("subtitle", metadata.path("subtitle").asText());
            lesson.put("estimated_minutes", metadata.path("estimated_minutes").asInt());
        } catch (Exception error) { warnings.add("Could not generate lesson metadata: " + error.getMessage()); }
        ArrayNode blocks = lesson.putArray("blocks");
        for (JsonNode source : blueprint.path("blocks")) {
            String id = source.path("id").asText();
            ObjectNode block = blocks.addObject().put("blueprint_block_id", id);
            job.update("WRITING_BLOCK_" + id);
            try {
                JsonNode prose = ai.generate(prosePrompt(source));
                block.put("heading", prose.path("heading").asText(source.path("title").asText()));
                block.put("body_html", prose.path("body_html").asText(fallbackBody(source)));
            } catch (Exception error) {
                block.put("heading", source.path("title").asText("Learning block"));
                block.put("body_html", fallbackBody(source));
                warnings.add("Could not write block " + id + ": " + error.getMessage());
            }
            ArrayNode assets = block.putArray("assets");
            String brief = source.path("content_brief").path("overview").asText(source.path("purpose").asText());
            String type = source.path("type").asText();
            if (brief.contains("Hình cần tạo:") || type.contains("image")) assets.addObject().put("kind", "image_placeholder").put("description", extractBrief(brief, "Hình cần tạo:")).put("caption", "Hình minh hoạ cần được tạo ở bước sau.");
            if (brief.contains("Diagram cần tạo:") || "diagram".equals(type) || "sequence".equals(type)) {
                job.update("GENERATING_DIAGRAM_" + id);
                try { addSafeAsset(assets, ai.generate(diagramPrompt(source))); } catch (Exception error) { warnings.add("Could not generate diagram for " + id + ": " + error.getMessage()); }
            }
            if (brief.contains("Mô phỏng HTML cần tạo:") || "simulation".equals(type)) {
                job.update("GENERATING_SIMULATION_" + id);
                try { addSafeAsset(assets, ai.generate(simulationPrompt(source))); } catch (Exception error) { warnings.add("Could not generate simulation for " + id + ": " + error.getMessage()); }
            }
        }
        return lesson;
    }

    private String metadataPrompt(JsonNode blueprint) { return """
        Return JSON only with title, subtitle, estimated_minutes for a clear Vietnamese beginner lesson. Use these approved block titles and objectives only; do not add facts. Keep title and subtitle short.
        BLUEPRINT:
        %s
        """.formatted(blueprint.toPrettyString()); }

    private String prosePrompt(JsonNode block) { return """
        Write one Vietnamese lesson section from this approved learning block. Return JSON only: {"heading":"...","body_html":"..."}.
        body_html uses only p,h3,ul,ol,li,strong,em,code,blockquote. Write smooth explanatory prose for beginners, not a production brief. Do not copy any paragraph beginning Hình cần tạo:, Diagram cần tạo:, or Mô phỏng HTML cần tạo: into prose; those assets are generated separately. Use only information in the block.
        BLOCK:
        %s
        """.formatted(block.toPrettyString()); }

    private String diagramPrompt(JsonNode block) { return """
        Generate one diagram from this approved learning block. Return JSON only: {"kind":"diagram","title":"...","nodes":[{"id":"...","label":"..."}],"edges":[{"from":"...","to":"...","label":"...","style":"solid|dashed"}]}.
        Follow every actor, node, relationship and ordered message in the paragraph beginning Diagram cần tạo:. Keep labels short but preserve the complete flow. Do not add facts.
        BLOCK:
        %s
        """.formatted(block.toPrettyString()); }

    private String simulationPrompt(JsonNode block) { return """
        Generate one safe self-contained interactive HTML simulation from this approved learning block. Return JSON only: {"kind":"simulation_html","title":"...","html":"..."}.
        Follow the paragraph beginning Mô phỏng HTML cần tạo:. html includes inline CSS and JavaScript, visible instructions, controls, feedback and reset when requested. No external URLs, fetch/network, forms, navigation, storage, iframe, object or embed. Do not add facts.
        BLOCK:
        %s
        """.formatted(block.toPrettyString()); }

    private String prompt(JsonNode blueprint) {
        return """
            Turn this approved lesson blueprint into a smooth, engaging Vietnamese lesson for beginners. Use only its described concepts and source-grounded claims. Do not mention the blueprint, production brief, or AI.
            Write it as a connected article someone can comfortably read from beginning to end, not as a conversion of notes, a checklist, or a slide deck. Each block must naturally continue the idea before it: begin with a short orienting sentence, explain why the next idea matters, then explain the mechanism in plain language before using jargon. Define a new technical term at first use and prefer concrete situations over abstract assertions. End each block with a brief bridge that makes the next block feel like the natural next question.
            Vary sentence length and use an encouraging, precise teaching voice. Use lists only when readers genuinely need to compare several items or follow an ordered procedure; otherwise write flowing paragraphs. Do not invent anecdotes, claims, examples, or details that are absent from the approved blueprint.
            Return JSON only: title, subtitle, estimated_minutes, blocks.
            Each block has blueprint_block_id, heading, body_html, assets.
            body_html is polished educational HTML using only p,h3,ul,ol,li,strong,em,code,blockquote. Use two to five meaningful paragraphs per ordinary block; preserve the learning order and make the prose complete enough to stand without the diagram.
            Read each content_brief.overview carefully. It may include production paragraphs marked Hình cần tạo:, Diagram cần tạo:, or Mô phỏng HTML cần tạo:. Do not copy those instructions into body_html.
            For Hình cần tạo: add an asset {kind:"image_placeholder",description,caption}.
            For Diagram cần tạo: add {kind:"diagram",title,nodes:[{id,label}],edges:[{from,to,label,style}]}. Include every actor/node and ordered relationship/message. style is solid or dashed.
            For Mô phỏng HTML cần tạo: add {kind:"simulation_html",title,html}. html must be a self-contained accessible mini-app with inline CSS and JavaScript, no external URLs, no fetch/network, no forms, no navigation, no local storage. Include visible instructions, controls, feedback, and reset when the brief asks for them.
            If a block type is diagram, sequence, or simulation, produce its matching asset even when the marker is missing, based on the block brief.
            APPROVED BLUEPRINT:
            %s
            """.formatted(blueprint.toPrettyString());
    }

    private JsonNode normalize(JsonNode candidate, JsonNode blueprint) {
        ObjectNode lesson = candidate != null && candidate.isObject() ? (ObjectNode) candidate : mapper.createObjectNode();
        if (lesson.path("title").asText().isBlank()) lesson.put("title", "Bài học từ lesson blueprint");
        if (lesson.path("subtitle").asText().isBlank()) lesson.put("subtitle", "Học theo từng bước, từ khái niệm đến áp dụng.");
        if (!lesson.path("estimated_minutes").canConvertToInt()) lesson.put("estimated_minutes", Math.max(5, blueprint.path("blocks").size() * 4));
        JsonNode generated = candidate != null && candidate.path("blocks").isArray() ? candidate.path("blocks").deepCopy() : mapper.createArrayNode();
        ArrayNode output = lesson.putArray("blocks");
        for (int index = 0; index < blueprint.path("blocks").size(); index++) {
            JsonNode source = blueprint.path("blocks").get(index);
            JsonNode generatedBlock = generated.isArray() && index < generated.size() ? generated.get(index) : null;
            ObjectNode block = output.addObject();
            block.put("blueprint_block_id", source.path("id").asText());
            block.put("heading", text(generatedBlock, "heading", source.path("title").asText("Learning block")));
            block.put("body_html", sanitizeHtml(text(generatedBlock, "body_html", fallbackBody(source))));
            ArrayNode assets = block.putArray("assets");
            if (generatedBlock != null && generatedBlock.path("assets").isArray()) {
                for (JsonNode asset : generatedBlock.path("assets")) addSafeAsset(assets, asset);
            }
            ensureAssetForBlock(assets, source);
        }
        lesson.put("generated_at", Instant.now().toString());
        return lesson;
    }

    private void addSafeAsset(ArrayNode target, JsonNode asset) {
        String kind = asset.path("kind").asText();
        if ("image_placeholder".equals(kind)) {
            target.addObject().put("kind", kind).put("description", asset.path("description").asText())
                    .put("caption", asset.path("caption").asText());
        } else if ("diagram".equals(kind)) {
            ObjectNode safe = target.addObject().put("kind", kind).put("title", asset.path("title").asText("Diagram"));
            ArrayNode nodes = safe.putArray("nodes");
            for (JsonNode node : asset.path("nodes")) if (!node.path("label").asText().isBlank()) {
                nodes.addObject().put("id", node.path("id").asText("node_" + nodes.size())).put("label", node.path("label").asText());
            }
            ArrayNode edges = safe.putArray("edges");
            for (JsonNode edge : asset.path("edges")) {
                String from = edge.path("from").asText(); String to = edge.path("to").asText();
                if (!from.isBlank() && !to.isBlank()) edges.addObject().put("from", from).put("to", to)
                        .put("label", edge.path("label").asText()).put("style", "dashed".equals(edge.path("style").asText()) ? "dashed" : "solid");
            }
            if (nodes.isEmpty()) target.remove(target.size() - 1);
        } else if ("simulation_html".equals(kind) && !asset.path("html").asText().isBlank()) {
            String html = asset.path("html").asText();
            if (html.length() <= 60000 && !html.matches("(?is).*<(?:iframe|object|embed|form)\\b.*") && !html.matches("(?is).*\\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|window\\.location)\\b.*")) {
                target.addObject().put("kind", kind).put("title", asset.path("title").asText("Mô phỏng"))
                        .put("html", html);
            }
        }
    }

    private void ensureAssetForBlock(ArrayNode assets, JsonNode source) {
        String brief = source.path("content_brief").path("overview").asText(source.path("purpose").asText());
        String type = source.path("type").asText();
        boolean hasImage = false, hasDiagram = false, hasSimulation = false;
        for (JsonNode asset : assets) { hasImage |= "image_placeholder".equals(asset.path("kind").asText()); hasDiagram |= "diagram".equals(asset.path("kind").asText()); hasSimulation |= "simulation_html".equals(asset.path("kind").asText()); }
        if ((brief.contains("Hình cần tạo:") || type.contains("image")) && !hasImage) assets.addObject().put("kind", "image_placeholder").put("description", extractBrief(brief, "Hình cần tạo:")).put("caption", "Hình minh hoạ cần được tạo ở bước sau.");
        if ((brief.contains("Diagram cần tạo:") || "diagram".equals(type) || "sequence".equals(type)) && !hasDiagram) assets.addObject().put("kind", "image_placeholder").put("description", extractBrief(brief, "Diagram cần tạo:")).put("caption", "Diagram chưa tạo được từ brief này.");
        if ((brief.contains("Mô phỏng HTML cần tạo:") || "simulation".equals(type)) && !hasSimulation) assets.addObject().put("kind", "image_placeholder").put("description", extractBrief(brief, "Mô phỏng HTML cần tạo:")).put("caption", "Mô phỏng chưa tạo được từ brief này.");
    }

    private JsonNode fallback(JsonNode blueprint) { return mapper.createObjectNode().put("title", "Bài học").put("subtitle", "Học từng phần theo lộ trình đã duyệt.").set("blocks", mapper.createArrayNode()); }
    private String fallbackBody(JsonNode source) { return "<p>" + escape(source.path("content_brief").path("overview").asText(source.path("purpose").asText("Nội dung đang được hoàn thiện."))) + "</p>"; }
    private static String text(JsonNode node, String field, String fallback) { String value = node == null ? "" : node.path(field).asText(); return value.isBlank() ? fallback : value; }
    private static String extractBrief(String value, String marker) { int start = value.indexOf(marker); return start < 0 ? value : value.substring(start + marker.length()).trim(); }
    private static String escape(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }
    private static String sanitizeHtml(String html) { return html.replaceAll("(?is)<(?:script|style|iframe|object|embed)[^>]*>.*?</(?:script|style|iframe|object|embed)>", "").replaceAll("(?i)\\son[a-z]+\\s*=\\s*(['\"]).*?\\1", "").replaceAll("(?i)javascript:", ""); }
    private Path lessonDir(String runId) { return runs.resolve(runId).resolve("lesson"); }
    private void write(Path path, Object value) throws IOException { Files.writeString(path, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(value), StandardCharsets.UTF_8); }

    public record Status(String runId, String status, String stage, String error, Instant updatedAt) { }
    private static class Job {
        final String runId; volatile String status = "QUEUED", stage = "QUEUED", error; volatile Instant updatedAt = Instant.now();
        Job(String runId) { this.runId = runId; }
        boolean running() { return "QUEUED".equals(status) || "RUNNING".equals(status); }
        void update(String stage) { status = "RUNNING"; this.stage = stage; updatedAt = Instant.now(); }
        void done() { status = "SUCCEEDED"; stage = "DONE"; updatedAt = Instant.now(); }
        void fail(String error) { status = "FAILED"; stage = "FAILED"; this.error = error; updatedAt = Instant.now(); }
        Status status() { return new Status(runId, status, stage, error, updatedAt); }
    }
}
