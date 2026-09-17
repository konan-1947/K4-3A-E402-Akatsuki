package com.akatsuki.studypulse.blueprint;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mental-model/runs/{runId}/blueprint")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class BlueprintController {
  private final BlueprintJobService jobs;
  public BlueprintController(BlueprintJobService jobs){this.jobs=jobs;}
  @PostMapping public ResponseEntity<?> create(@PathVariable String runId)throws IOException{return ResponseEntity.status(HttpStatus.ACCEPTED).body(jobs.create(runId));}
  @GetMapping public BlueprintJobService.Status status(@PathVariable String runId)throws IOException{return jobs.status(runId);}
  @GetMapping("/draft") public JsonNode draft(@PathVariable String runId)throws IOException{return jobs.draft(runId);}
  @PutMapping("/draft") public JsonNode save(@PathVariable String runId,@RequestBody JsonNode draft)throws IOException{return jobs.save(runId,draft);}
  @PostMapping("/approve") public JsonNode approve(@PathVariable String runId)throws IOException{return jobs.approve(runId);}
}
