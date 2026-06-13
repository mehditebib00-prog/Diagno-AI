package com.diagnoai.controller;

import com.diagnoai.dto.AuthResponse;
import com.diagnoai.dto.LoginRequest;
import com.diagnoai.dto.RegisterRequest;
import com.diagnoai.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// 💡 CORRECTION 1 : On autorise le cross-origin pour tout le monde ("*")
// pour que ton téléphone portable puisse envoyer des requêtes.

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private void setAuthService(AuthService authService) {
        this.authService = authService;
    }
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            System.out.println("=== Inscription entrante ===");
            System.out.println("Name: " + request.getName());
            System.out.println("Email: " + request.getEmail());

            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERREUR INSCRIPTION :");
            e.printStackTrace();
            // 💡 On renvoie un JSON propre avec le message d'erreur
            return ResponseEntity.status(400).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            System.out.println("=== Connexion entrante ===");
            System.out.println("Email: " + request.getEmail());

            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERREUR CONNEXION :");
            e.printStackTrace();
            // 💡 CORRECTION 2 : Si le mot de passe est faux ou l'utilisateur n'existe pas,
            // on attrape l'erreur et on renvoie un code 401 (Unauthorized) avec le message.
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Invalid email or password"));
        }
    }
}