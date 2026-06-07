package com.diagnoai.controller;

import com.diagnoai.dto.MedicationDTO;
import com.diagnoai.service.MedicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    @Autowired
    private MedicationService medicationService;

    // Only doctors can see all meds
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping
    public ResponseEntity<List<MedicationDTO>> getAllMedications() {
        return ResponseEntity.ok(medicationService.getAllMedications());
    }

    // Doctor OR patient (but filtered in service)
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicationDTO>> getMedicationsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicationService.getMedicationsByPatientId(patientId));
    }

    // Only doctors can view a specific medication
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/{id}")
    public ResponseEntity<MedicationDTO> getMedicationById(@PathVariable Long id) {
        return medicationService.getMedicationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // IMPORTANT: only doctor can prescribe
    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public ResponseEntity<MedicationDTO> createMedication(@RequestBody MedicationDTO medicationDTO) {
        return ResponseEntity.ok(medicationService.createMedication(medicationDTO));
    }

    // Only doctor can update prescription
    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<MedicationDTO> updateMedication(@PathVariable Long id,
                                                          @RequestBody MedicationDTO medicationDTO) {
        return medicationService.updateMedication(id, medicationDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Only doctor can delete medication
    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        if (medicationService.deleteMedication(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}