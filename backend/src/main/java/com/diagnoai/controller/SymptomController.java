package com.diagnoai.controller;

import com.diagnoai.dto.SymptomDTO;
import com.diagnoai.service.SymptomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {

    @Autowired
    private SymptomService symptomService;

    @GetMapping
    public ResponseEntity<List<SymptomDTO>> getAllSymptoms() {
        return ResponseEntity.ok(symptomService.getAllSymptoms());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<SymptomDTO>> getSymptomsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(symptomService.getSymptomsByPatientId(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SymptomDTO> getSymptomById(@PathVariable Long id) {
        return symptomService.getSymptomById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SymptomDTO> createSymptom(@RequestBody SymptomDTO symptomDTO) {
        SymptomDTO createdSymptom = symptomService.createSymptom(symptomDTO);
        return ResponseEntity.ok(createdSymptom);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SymptomDTO> updateSymptom(@PathVariable Long id, @RequestBody SymptomDTO symptomDTO) {
        return symptomService.updateSymptom(id, symptomDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSymptom(@PathVariable Long id) {
        if (symptomService.deleteSymptom(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}