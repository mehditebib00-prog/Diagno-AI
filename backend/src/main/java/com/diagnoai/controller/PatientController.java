package com.diagnoai.controller;

import com.diagnoai.dto.PatientDTO;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
    private PatientRepository patientRepository;

    @GetMapping("/search")
    public ResponseEntity<?> searchPatient(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String name) {

        System.out.println("Recherche flexible - ID: " + id + ", Nom: " + name);

        if (id != null && (name == null || name.trim().isEmpty())) {
            Optional<Patient> patientOpt = patientRepository.findById(id);
            if (patientOpt.isPresent()) {
                return ResponseEntity.ok(List.of(convertToMap(patientOpt.get())));
            }
        }
        else if (name != null && !name.trim().isEmpty()) {
            List<Patient> patients = patientRepository.findByNameContainingIgnoreCase(name.trim());

            if (id != null) {
                patients = patients.stream().filter(p -> p.getId().equals(id)).toList();
            }

            if (!patients.isEmpty()) {
                // 🚀 Modification ici : Liste de Map<String, Object>
                List<Map<String, Object>> result = patients.stream().map(this::convertToMap).toList();
                return ResponseEntity.ok(result);
            }
        }
        else {
            List<Patient> allPatients = patientRepository.findAll();
            // 🚀 Modification ici : Liste de Map<String, Object>
            List<Map<String, Object>> result = allPatients.stream().map(this::convertToMap).toList();
            return ResponseEntity.ok(result);
        }

        return ResponseEntity.status(404).body(Map.of("message", "Aucun patient trouvé."));
    }

    // 🚀 FONCTION CORRIGÉE : Changement en Map<String, Object> et retour propre de la valeur d'origine (null incluse)
    private Map<String, Object> convertToMap(Patient p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId().toString());
        map.put("name", p.getName());
        map.put("email", p.getEmail());
        map.put("socialSecurity", p.getSocialSecurity());
        map.put("profilePicture", p.getProfilePicture()); // Envoie la valeur exacte (null ou Base64) sans la dénaturer en ""
        return map;
    }

    @GetMapping
    public ResponseEntity<List<PatientDTO>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profile")
    public ResponseEntity<PatientDTO> getPatientProfile(@RequestParam String email) {
        return patientService.getPatientByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PatientDTO> createPatient(@RequestBody PatientDTO patientDTO) {
        PatientDTO createdPatient = patientService.createPatient(patientDTO);
        return ResponseEntity.ok(createdPatient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable Long id, @RequestBody PatientDTO patientDTO) {
        return patientService.updatePatient(id, patientDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        if (patientService.deletePatient(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}