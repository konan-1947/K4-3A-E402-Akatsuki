package com.akatsuki.studypulse.lesson;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mental-model/runs/{runId}/blueprint/lesson")
public class LessonController {
    private final LessonJobService jobs;
    public LessonController(LessonJobService jobs) { this.jobs = jobs; }
    @PostMapping public ResponseEntity<?> create(@PathVariable String runId) throws IOException { return ResponseEntity.status(HttpStatus.ACCEPTED).body(jobs.create(runId)); }
    @GetMapping public LessonJobService.Status status(@PathVariable String runId) throws IOException { return jobs.status(runId); }
    @GetMapping("/draft") public JsonNode draft(@PathVariable String runId) throws IOException { return jobs.draft(runId); }
}
