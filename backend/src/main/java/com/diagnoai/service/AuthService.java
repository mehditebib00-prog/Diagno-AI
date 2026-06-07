package com.diagnoai.service;

import com.diagnoai.dto.AuthResponse;
import com.diagnoai.dto.LoginRequest;
import com.diagnoai.dto.RegisterRequest;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // =========================
    // REGISTER
    // =========================
    public AuthResponse register(RegisterRequest request) {

        if (patientRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        Patient patient = new Patient();
        patient.setName(request.getName());
        patient.setEmail(request.getEmail());
        patient.setSocialSecurity(request.getSocialSecurity());

        patient.setPassword(passwordEncoder.encode(request.getPassword()));

        Patient saved = patientRepository.save(patient);

        String token = jwtUtils.generateToken(saved.getEmail());

        return new AuthResponse(
                token,
                saved.getId(),
                saved.getEmail(),
                saved.getName()
        );
    }

    // =========================
    // LOGIN
    // =========================
    public AuthResponse login(LoginRequest request) {

        Patient patient = patientRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), patient.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtils.generateToken(patient.getEmail());

        return new AuthResponse(
                token,
                patient.getId(),
                patient.getEmail(),
                patient.getName()
        );
    }
}