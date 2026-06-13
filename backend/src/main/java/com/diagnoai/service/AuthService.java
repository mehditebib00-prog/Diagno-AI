package com.diagnoai.service;

import com.diagnoai.dto.AuthResponse;
import com.diagnoai.dto.LoginRequest;
import com.diagnoai.dto.RegisterRequest;
import com.diagnoai.model.Patient;
import com.diagnoai.model.Doctor;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.repository.DoctorRepository;
import com.diagnoai.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository; // 💡 Injection du repository Médecin

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // =========================
    // REGISTER (PATIENT)
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
    // LOGIN (PATIENT & DOCTOR)
    // =========================
    public AuthResponse login(LoginRequest request) {

        // 1. On cherche d'abord si c'est un Patient
        Optional<Patient> patientOpt = patientRepository.findByEmail(request.getEmail());
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), patient.getPassword())) {
                throw new RuntimeException("Invalid credentials");
            }
            String token = jwtUtils.generateToken(patient.getEmail());
            return new AuthResponse(token, patient.getId(), patient.getEmail(), patient.getName());
        }

        // 2. Si ce n'est pas un patient, on cherche si c'est un Médecin (Doctor)
        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(request.getEmail());
        if (doctorOpt.isPresent()) {
            Doctor doctor = doctorOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), doctor.getPassword())) {
                throw new RuntimeException("Invalid credentials");
            }
            String token = jwtUtils.generateToken(doctor.getEmail());

            // On retourne la réponse d'authentification pour le médecin
            return new AuthResponse(token, Long.valueOf(doctor.getId()), doctor.getEmail(), doctor.getName());
        }

        // 3. Si l'email n'est nulle part
        throw new RuntimeException("Invalid credentials");
    }
}