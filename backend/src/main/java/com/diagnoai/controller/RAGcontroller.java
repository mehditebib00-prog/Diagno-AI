package com.diagnoai.controller;

import com.diagnoai.ai.RAGknowledgebasebuilder;
import com.diagnoai.ai.RAGservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 *
 * POST /api/rag/rebuild  → reads medical_data/*.json, embeds, writes knowledge base
 * GET  /api/rag/status   → shows how many chunks are loaded
 * POST /api/rag/query    → test a semantic search query directly
 */
@RestController
@RequestMapping("/api/rag")
public class RAGcontroller {

    @Autowired
    private RAGknowledgebasebuilder builder;

    @Autowired
    private RAGservice ragService;

    /**
     * Trigger a full knowledge base rebuild.
     */
    @PostMapping("/rebuild")
    public ResponseEntity<Map<String, Object>> rebuild() {
        RAGknowledgebasebuilder.BuildResult result = builder.build();
        return ResponseEntity
            .status(result.success() ? 200 : 500)
            .body(Map.of(
                "success", result.success(),
                "message", result.message()
            ));
    }

    /**
     * Check if the knowledge base is loaded and how many chunks it has.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "loaded",      ragService.isLoaded(),
            "chunkCount",  ragService.getChunkCount()
        ));
    }

    /**
     * Test a semantic query against the knowledge base.
     * Body: { "query": "your question here" }
     */
    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> query(@RequestBody Map<String, String> body) {
        String query = body.get("query");
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Missing 'query' field in request body."));
        }
        String context = ragService.retrieveContext(query);
        return ResponseEntity.ok(Map.of(
            "query",   query,
            "context", context
        ));
    }
}