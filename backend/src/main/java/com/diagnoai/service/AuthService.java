package com.diagnoai.service;

import com.diagnoai.dto.AuthResponse;
import com.diagnoai.dto.LoginRequest;
import com.diagnoai.dto.PatientDTO;
import com.diagnoai.dto.RegisterRequest;
import com.diagnoai.model.Patient;
import com.diagnoai.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private PatientService patientService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (patientService.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        // Create new patient
        PatientDTO patientDTO = new PatientDTO(null, request.getName(), request.getEmail(), request.getPassword());
        PatientDTO savedPatientDTO = patientService.createPatient(patientDTO);
        Patient savedPatient = patientService.findByEmail(savedPatientDTO.getEmail()).get();

        // Generate JWT token
        String token = jwtUtils.generateToken(savedPatient.getEmail());

        return new AuthResponse(token, savedPatient.getId(), savedPatient.getEmail(), savedPatient.getName());
    }

    public AuthResponse login(LoginRequest request) {
        Optional<Patient> patientOpt = patientService.findByEmail(request.getEmail());
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            if (passwordEncoder.matches(request.getPassword(), patient.getPassword())) {
                String token = jwtUtils.generateToken(patient.getEmail());
                return new AuthResponse(token, patient.getId(), patient.getEmail(), patient.getName());
            }
        }
        throw new RuntimeException("Invalid credentials");
    }
}