package com.diagnoai.controller;

import com.diagnoai.dto.SymptomDTO;
import com.diagnoai.service.SymptomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('PATIENT')")

    @PostMapping
    public ResponseEntity<SymptomDTO> createSymptom(@RequestBody SymptomDTO symptomDTO) {
        SymptomDTO createdSymptom = symptomService.createSymptom(symptomDTO);
        return ResponseEntity.ok(createdSymptom);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}")
    public ResponseEntity<SymptomDTO> updateSymptom(@PathVariable Long id, @RequestBody SymptomDTO symptomDTO) {
        return symptomService.updateSymptom(id, symptomDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSymptom(@PathVariable Long id) {
        if (symptomService.deleteSymptom(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // 💡 ENDPOINTS SIMPLIFIÉS POUR LE MOBILE (Sans blocage de rôle)

    // Récupérer les symptômes d'un patient
    @GetMapping("/mobile/patient/{patientId}")
    public ResponseEntity<List<SymptomDTO>> getSymptomsMobile(@PathVariable Long patientId) {
        System.out.println("Mobile - Récupération des symptômes pour le patient ID : " + patientId);
        return ResponseEntity.ok(symptomService.getSymptomsByPatientId(patientId));
    }

    // Ajouter un symptôme depuis le mobile
    @PostMapping("/mobile/add")
    public ResponseEntity<SymptomDTO> createSymptomMobile(@RequestBody SymptomDTO symptomDTO) {
        System.out.println("Mobile - Ajout d'un symptôme pour le patient ID : " + symptomDTO.getPatientId());
        if (symptomDTO.getDate() == null) {
            symptomDTO.setDate(java.time.LocalDateTime.now()); // Met la date actuelle si elle est vide
        }
        SymptomDTO created = symptomService.createSymptom(symptomDTO);
        return ResponseEntity.ok(created);
    }

    // Supprimer un symptôme depuis le mobile
    @DeleteMapping("/mobile/delete/{id}")
    public ResponseEntity<Void> deleteSymptomMobile(@PathVariable Long id) {
        System.out.println("Mobile - Suppression du symptôme ID : " + id);
        if (symptomService.deleteSymptom(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }


}