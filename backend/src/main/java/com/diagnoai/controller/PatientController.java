package com.diagnoai.controller;

import com.diagnoai.dto.PatientDTO;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(originPatterns = "*")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private PatientRepository patientRepository; // Pour la recherche directe


    // 💡 NOUVELLE VERSION : Recherche flexible par ID, par Nom, ou retourne tout si vide
    @GetMapping("/search")
    public ResponseEntity<?> searchPatient(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String name) {

        System.out.println("Recherche flexible - ID: " + id + ", Nom: " + name);

        // Cas 1 : Recherche par ID uniquement
        if (id != null && (name == null || name.trim().isEmpty())) {
            Optional<Patient> patientOpt = patientRepository.findById(id);
            if (patientOpt.isPresent()) {
                return ResponseEntity.ok(List.of(convertToMap(patientOpt.get())));
            }
        }
        // Cas 2 : Recherche par Nom uniquement (ou Nom + ID si fournis)
        else if (name != null && !name.trim().isEmpty()) {
            List<Patient> patients = patientRepository.findByNameContainingIgnoreCase(name.trim());

            // Si un ID était aussi fourni, on filtre le résultat sur cet ID précis
            if (id != null) {
                patients = patients.stream().filter(p -> p.getId().equals(id)).toList();
            }

            if (!patients.isEmpty()) {
                List<Map<String, String>> result = patients.stream().map(this::convertToMap).toList();
                return ResponseEntity.ok(result);
            }
        }
        // Cas 3 : Aucun critère fourni -> On affiche TOUTS les patients de la BDD
        else {
            List<Patient> allPatients = patientRepository.findAll();
            List<Map<String, String>> result = allPatients.stream().map(this::convertToMap).toList();
            return ResponseEntity.ok(result);
        }

        return ResponseEntity.status(404).body(Map.of("message", "Aucun patient trouvé."));
    }

    // Petite fonction d'aide pour formater le JSON renvoyé
    private Map<String, String> convertToMap(Patient p) {
        return Map.of(
                "id", p.getId().toString(),
                "name", p.getName(),
                "email", p.getEmail() != null ? p.getEmail() : "",
                "socialSecurity", p.getSocialSecurity() != null ? p.getSocialSecurity() : ""
        );
    }

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profile")
    public ResponseEntity<Patient> getPatientProfile(@RequestParam String email) {
        return patientService.getPatientByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient createdPatient = patientService.savePatient(patient);
        return ResponseEntity.ok(createdPatient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        return patientService.updatePatient(id, patient)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

   @DeleteMapping("/{id}")
public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
    patientService.deletePatient(id);
    return ResponseEntity.noContent().build();

    }
}