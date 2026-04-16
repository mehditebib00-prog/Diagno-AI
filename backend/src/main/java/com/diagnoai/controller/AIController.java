package com.diagnoai.controller;

import com.diagnoai.ai.MCPContextBuilder;
import com.diagnoai.service.SymptomAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private SymptomAnalysisService symptomAnalysisService;

    @Autowired
    private MCPContextBuilder mcpContextBuilder;

    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeSymptoms(@RequestParam Long patientId) {
        String context = mcpContextBuilder.buildContext(patientId);
        String analysis = symptomAnalysisService.analyzeSymptoms(context);
        return ResponseEntity.ok(analysis);
    }
}