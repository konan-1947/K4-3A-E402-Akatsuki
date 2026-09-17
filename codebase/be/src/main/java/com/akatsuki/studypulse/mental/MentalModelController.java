package com.akatsuki.studypulse.mental;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/mental-model/runs")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class MentalModelController {

    private final MentalModelJobService jobs;

    public MentalModelController(MentalModelJobService jobs) {
        this.jobs = jobs;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MentalModelJobService.RunCreatedResponse> create(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "topicInstruction", required = false) String topicInstruction) throws IOException {
        List<MentalModelJobService.UploadedDocument> documents = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) throw new IllegalArgumentException("Empty file: " + file.getOriginalFilename());
            documents.add(new MentalModelJobService.UploadedDocument(file.getOriginalFilename(), file.getContentType(), file.getBytes()));
        }
        String runId = jobs.submit(documents, topicInstruction);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new MentalModelJobService.RunCreatedResponse(runId, "QUEUED"));
    }

    @GetMapping("/{runId}")
    public MentalModelJobService.JobStatusResponse status(@PathVariable String runId) {
        return jobs.status(runId);
    }

    @GetMapping("/{runId}/result")
    public MentalModelResult result(@PathVariable String runId) {
        return jobs.result(runId);
    }
}
