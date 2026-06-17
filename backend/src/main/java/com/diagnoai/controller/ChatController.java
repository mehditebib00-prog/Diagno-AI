package com.diagnoai.controller;

import com.diagnoai.ai.RAGservice;
import com.diagnoai.model.Patient;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.diagnoai.security.JwtUtils;
import com.diagnoai.repository.PatientRepository;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RAGservice ragService;
    private final JwtUtils jwtUtils;
    private final PatientRepository patientRepository;
    public ChatController(RAGservice ragService, JwtUtils jwtUtils, PatientRepository patientRepository) {
        this.ragService = ragService;
        this.jwtUtils = jwtUtils;
        this.patientRepository = patientRepository;
    }

@PostMapping
public ResponseEntity<Map<String, String>> chat(
        @RequestBody Map<String, String> body,
        @RequestHeader("Authorization") String authHeader) {

    String token = authHeader.replace("Bearer ", "");

    String email = jwtUtils.getEmailFromToken(token);

    Patient patient = patientRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Patient not found for email: " + email));
    Long patientId = patient.getId();

    String question = body.get("message");

    String response = ragService.answer(question, patientId);

    return ResponseEntity.ok(Map.of(
            "question", question,
            "response", response
    ));
}
}