package com.akatsuki.studypulse.mental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MentalModelJobService {

    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Executor executor;
    private final Path runsDirectory;
    private final ObjectMapper mapper;
    private final DocumentParser parser;
    private final DocumentChunker chunker;
    private final FactExtractionService extraction;
    private final NormalizationService normalization;
    private final DomainSynthesisService domainSynthesis;
    private final MentalModelSynthesisService modelSynthesis;
    private final MentalModelValidator validator;
    private final MentalModelHtmlRenderer renderer;

    public MentalModelJobService(
            @Qualifier("mentalModelTaskExecutor") Executor executor,
            @Value("${app.mental-model.runs-dir:runs}") String runsDirectory,
            ObjectMapper mapper,
            DocumentParser parser,
            DocumentChunker chunker,
            FactExtractionService extraction,
            NormalizationService normalization,
            DomainSynthesisService domainSynthesis,
            MentalModelSynthesisService modelSynthesis,
            MentalModelValidator validator,
            MentalModelHtmlRenderer renderer) {
        this.executor = executor;
        this.runsDirectory = Path.of(runsDirectory);
        this.mapper = mapper;
        this.parser = parser;
        this.chunker = chunker;
        this.extraction = extraction;
        this.normalization = normalization;
        this.domainSynthesis = domainSynthesis;
        this.modelSynthesis = modelSynthesis;
        this.validator = validator;
        this.renderer = renderer;
    }

    public String submit(List<UploadedDocument> documents, String topicInstruction) {
        if (documents == null || documents.isEmpty()) throw new IllegalArgumentException("At least one file is required");
        String runId = "run_" + UUID.randomUUID().toString().replace("-", "");
        Job job = new Job(runId, topicInstruction == null ? "" : topicInstruction);
        jobs.put(runId, job);
        executor.execute(() -> process(job, documents));
        return runId;
    }

    public JobStatusResponse status(String runId) {
        Job job = find(runId);
        return job.status();
    }

    public MentalModelResult result(String runId) {
        Job job = find(runId);
        if (!"SUCCEEDED".equals(job.status)) {
            throw new IllegalStateException("Job is not complete");
        }
        return job.result;
    }

    private void process(Job job, List<UploadedDocument> documents) {
        try {
            Path runDirectory = runsDirectory.resolve(job.runId);
            Path inputDirectory = runDirectory.resolve("input");
            Files.createDirectories(inputDirectory);
            List<DocumentManifest> manifests = saveInputs(documents, inputDirectory);
            writeJson(runDirectory.resolve("manifest.json"), manifests);

            List<DocumentChunk> chunks = new ArrayList<>();
            for (int index = 0; index < documents.size(); index++) {
                DocumentParser.ParsedDocument parsed = parser.parse(manifests.get(index), documents.get(index).bytes());
                chunks.addAll(chunker.chunk(parsed));
            }
            if (chunks.isEmpty()) throw new IllegalArgumentException("No readable text found in uploaded files");
            writeJsonLines(runDirectory.resolve("chunks.jsonl"), chunks);

            job.update("EXTRACTING_FACTS", 0, chunks.size());
            List<FactSet> facts = extraction.extract(chunks, job.topicInstruction,
                    (completed, total) -> job.update("EXTRACTING_FACTS", completed, total));
            writeJsonLines(runDirectory.resolve("facts.jsonl"), facts);
            job.update("NORMALIZING", facts.size(), facts.size());

            JsonNode normalizedFacts = normalization.normalize(facts);
            writeJson(runDirectory.resolve("normalized-facts.json"), normalizedFacts);

            job.update("SYNTHESIZING_DOMAINS", 0, 1);
            List<JsonNode> domains = domainSynthesis.synthesize(normalizedFacts, job.topicInstruction);
            writeJson(runDirectory.resolve("domain-models.json"), domains);

            job.update("SYNTHESIZING_MENTAL_MODEL", 0, 1);
            JsonNode conflicts = collectConflicts(normalizedFacts);
            JsonNode mentalModel = modelSynthesis.synthesize(domains, conflicts, job.topicInstruction);
            String renderedHtml = renderer.render(mentalModel);
            JsonNode validation = validator.validate(mentalModel, normalizedFacts);
            MentalModelResult result = new MentalModelResult(job.runId, mentalModel, renderedHtml, validation);
            writeJson(runDirectory.resolve("mental-model.json"), result);
            writeJson(runDirectory.resolve("validation-report.json"), validation);
            Files.writeString(runDirectory.resolve("mental-model.md"), renderedHtml, StandardCharsets.UTF_8);
            job.complete(result);
        } catch (Exception exception) {
            job.fail(rootMessage(exception));
        }
    }

    private List<DocumentManifest> saveInputs(List<UploadedDocument> documents, Path inputDirectory) throws IOException {
        List<DocumentManifest> manifests = new ArrayList<>();
        for (int index = 0; index < documents.size(); index++) {
            UploadedDocument document = documents.get(index);
            String documentId = "doc_" + (index + 1);
            String fileName = safeFileName(document.fileName());
            Files.write(inputDirectory.resolve(documentId + "_" + fileName), document.bytes());
            manifests.add(new DocumentManifest(documentId, fileName,
                    document.mediaType(), sha256(document.bytes()), document.bytes().length));
        }
        return manifests;
    }

    private static String safeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) return "unnamed-file";
        String safe = Path.of(fileName).getFileName().toString().replaceAll("[^A-Za-z0-9._ -]", "_");
        return safe.isBlank() ? "unnamed-file" : safe;
    }

    private JsonNode collectConflicts(JsonNode normalizedFacts) {
        var conflicts = mapper.createArrayNode();
        for (JsonNode factSet : normalizedFacts.path("fact_sets")) {
            JsonNode values = factSet.path("conflicts");
            if (values.isArray()) values.forEach(conflicts::add);
        }
        return conflicts;
    }

    private void writeJson(Path path, Object value) throws IOException {
        Files.writeString(path, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(value), StandardCharsets.UTF_8);
    }

    private void writeJsonLines(Path path, Iterable<?> values) throws IOException {
        StringBuilder content = new StringBuilder();
        for (Object value : values) content.append(mapper.writeValueAsString(value)).append('\n');
        Files.writeString(path, content.toString(), StandardCharsets.UTF_8);
    }

    private Job find(String runId) {
        Job job = jobs.get(runId);
        if (job == null) throw new IllegalArgumentException("Unknown runId: " + runId);
        return job;
    }

    private static String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder result = new StringBuilder("sha256:");
            for (byte item : digest) result.append(String.format("%02x", item));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private static String rootMessage(Throwable error) {
        Throwable root = error;
        while (root.getCause() != null) root = root.getCause();
        return root.getMessage() == null ? root.getClass().getSimpleName() : root.getMessage();
    }

    public record UploadedDocument(String fileName, String mediaType, byte[] bytes) { }

    public record JobStatusResponse(String runId, String status, int completed, int total, String stage, String error, Instant updatedAt) { }

    public record RunCreatedResponse(String runId, String status) { }

    private static final class Job {
        private final String runId;
        private final String topicInstruction;
        private volatile String status = "QUEUED";
        private volatile int completed;
        private volatile int total;
        private volatile String stage = "QUEUED";
        private volatile String error;
        private volatile Instant updatedAt = Instant.now();
        private volatile MentalModelResult result;

        private Job(String runId, String topicInstruction) {
            this.runId = runId;
            this.topicInstruction = topicInstruction;
        }

        private void update(String stage, int completed, int total) {
            this.status = "RUNNING";
            this.stage = stage;
            this.completed = completed;
            this.total = total;
            this.updatedAt = Instant.now();
        }

        private void complete(MentalModelResult result) {
            this.result = result;
            this.status = "SUCCEEDED";
            this.stage = "DONE";
            this.completed = this.total;
            this.updatedAt = Instant.now();
        }

        private void fail(String error) {
            this.status = "FAILED";
            this.stage = "FAILED";
            this.error = error;
            this.updatedAt = Instant.now();
        }

        private JobStatusResponse status() {
            return new JobStatusResponse(runId, status, completed, total, stage, error, updatedAt);
        }
    }
}
