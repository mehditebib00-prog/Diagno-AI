package com.diagnoai.controller;

import com.diagnoai.model.Doctor;
import com.diagnoai.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
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

    // 💡 ENDPOINT PROFIL MODIFIÉ : Ajout du champ profilePicture pour le mobile !
    @GetMapping("/profile")
    public ResponseEntity<?> getDoctorProfile(@RequestParam String email) {
        System.out.println("Récupération du profil pour : " + email);

        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(email);
        if (doctorOpt.isPresent()) {
            Doctor doctor = doctorOpt.get();

            Map<String, Object> response = new HashMap<>();
            response.put("id", doctor.getId());
            response.put("name", doctor.getName());
            response.put("email", doctor.getEmail());
            response.put("specialization", doctor.getSpecialization() != null ? doctor.getSpecialization() : "Generalist");
            response.put("hospital", "Hôpital Central");
            response.put("phone", "+33 6 12 34 56 78");
            // On renvoie la photo si elle existe, sinon une chaîne vide
            response.put("profilePicture", doctor.getProfilePicture() != null ? doctor.getProfilePicture() : "");

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(404).body(Map.of("message", "Doctor not found"));
    }

    // 🚀 NOUVEL ENDPOINT : Gère la mise à jour (PUT) demandée par le mobile pour enregistrer la photo !
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Map<String, Object> doctorData) {
        System.out.println("🚀 Requête PUT reçue pour modifier le docteur ID: " + id);

        return doctorRepository.findById(id).map(doctor -> {
            if (doctorData.containsKey("name")) {
                doctor.setName((String) doctorData.get("name"));
            }
            if (doctorData.containsKey("specialization")) {
                doctor.setSpecialization((String) doctorData.get("specialization"));
            }

            // Sécurité : On ne remplace la photo que si le mobile envoie du texte valide
            if (doctorData.containsKey("profilePicture")) {
                String photo = (String) doctorData.get("profilePicture");
                if (photo != null && !photo.trim().isEmpty()) {
                    System.out.println("💾 Sauvegarde de la photo du docteur en Base de données !");
                    doctor.setProfilePicture(photo);
                }
            }

            Doctor updatedDoctor = doctorRepository.save(doctor);
            return ResponseEntity.ok(updatedDoctor);
        }).orElse(ResponseEntity.notFound().build());
    }
}