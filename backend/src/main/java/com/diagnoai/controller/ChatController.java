package com.diagnoai.controller;

import com.diagnoai.ai.RAGservice;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RAGservice ragService;

    public ChatController(RAGservice ragService) {
        this.ragService = ragService;
    }

   @PostMapping
public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {

    String question = body.get("message");
    Long patientId = Long.valueOf(body.get("patientId"));

    String response = ragService.answer(question, patientId);

    return ResponseEntity.ok(Map.of(
        "question", question,
        "response", response
    ));

    }
}