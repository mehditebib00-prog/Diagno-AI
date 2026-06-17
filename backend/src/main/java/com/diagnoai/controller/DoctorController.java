package com.diagnoai.controller;

import com.diagnoai.model.Doctor;
import com.diagnoai.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(originPatterns = "*")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    // Connexion du médecin
    @PostMapping("/login")
    public ResponseEntity<?> loginDoctor(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        System.out.println("Tentative de connexion médecin pour : " + email);

        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(email);

        // 💡 Validation simple avec le mot de passe en clair ou crypté (à adapter selon ton encodage)
        if (doctorOpt.isPresent() && doctorOpt.get().getPassword().equals(password)) {
            Doctor doctor = doctorOpt.get();
            return ResponseEntity.ok(Map.of(
                    "email", doctor.getEmail(),
                    "id", doctor.getId(),
                    "name", doctor.getName(),
                    "specialization", doctor.getSpecialization(),
                    "token", "fake-jwt-token-for-doctor",
                    "type", "Bearer"
            ));
        }

        return ResponseEntity.status(400).body(Map.of("message", "Invalid email or password"));
    }

    // 💡 NOUVEL ENDPOINT : Récupérer le profil réel du médecin connecté
    @GetMapping("/profile")
    public ResponseEntity<?> getDoctorProfile(@RequestParam String email) {
        System.out.println("Récupération du profil pour : " + email);

        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(email);
        if (doctorOpt.isPresent()) {
            Doctor doctor = doctorOpt.get();
            return ResponseEntity.ok(Map.of(
                    "id", doctor.getId(),
                    "name", doctor.getName(),
                    "email", doctor.getEmail(),
                    "specialization", doctor.getSpecialization() != null ? doctor.getSpecialization() : "Generalist",
                    "hospital", "Hôpital Central", // Optionnel ou à ajouter plus tard dans ton modèle
                    "phone", "+33 6 12 34 56 78"
            ));
        }

        return ResponseEntity.status(404).body(Map.of("message", "Doctor not found"));
    }
}