package com.diagnoai.controller;

import com.diagnoai.dto.AuthResponse;
import com.diagnoai.dto.LoginRequest;
import com.diagnoai.dto.RegisterRequest;
import com.diagnoai.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

   @PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
        System.out.println("Incoming request:");
        System.out.println("Name: " + request.getName());
        System.out.println("Email: " + request.getEmail());
        System.out.println("Password: " + request.getPassword());

        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);

    } catch (Exception e) {
        System.err.println("REGISTER ERROR:");
        e.printStackTrace(); // 🔥 THIS IS THE KEY
        return ResponseEntity.status(500).body(e.getMessage());
    }
}

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}