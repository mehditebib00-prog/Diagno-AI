package com.diagnoai.controller;

import com.diagnoai.dto.MedicationDTO;
import com.diagnoai.service.MedicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    @Autowired
    private MedicationService medicationService;

    @GetMapping
    public ResponseEntity<List<MedicationDTO>> getAllMedications() {
        return ResponseEntity.ok(medicationService.getAllMedications());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicationDTO>> getMedicationsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicationService.getMedicationsByPatientId(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicationDTO> getMedicationById(@PathVariable Long id) {
        return medicationService.getMedicationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MedicationDTO> createMedication(@RequestBody MedicationDTO medicationDTO) {
        MedicationDTO createdMedication = medicationService.createMedication(medicationDTO);
        return ResponseEntity.ok(createdMedication);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicationDTO> updateMedication(@PathVariable Long id, @RequestBody MedicationDTO medicationDTO) {
        return medicationService.updateMedication(id, medicationDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        if (medicationService.deleteMedication(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}