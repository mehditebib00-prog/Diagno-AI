package com.diagnoai.service;

import com.diagnoai.dto.PatientDTO;
import com.diagnoai.model.Doctor;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.DoctorRepository;
import com.diagnoai.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // GET ALL PATIENTS
    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // GET PATIENT BY ID
    public Optional<PatientDTO> getPatientById(Long id) {
        return patientRepository.findById(id)
                .map(this::convertToDTO);
    }

    // CREATE PATIENT + AUTO ASSIGN DOCTOR
    public PatientDTO createPatient(PatientDTO patientDTO) {

        Patient patient = convertToEntity(patientDTO);

        // Encode password
        patient.setPassword(passwordEncoder.encode(patient.getPassword()));

        // Assign doctor (simple MVP logic)
        Doctor doctor = doctorRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No doctors available"));

        patient.setDoctor(doctor);

        Patient savedPatient = patientRepository.save(patient);

        return convertToDTO(savedPatient);
    }

    // UPDATE PATIENT
    public Optional<PatientDTO> updatePatient(Long id, PatientDTO patientDTO) {
        return patientRepository.findById(id).map(patient -> {

            patient.setName(patientDTO.getName());
            patient.setEmail(patientDTO.getEmail());

            if (patientDTO.getPassword() != null) {
                patient.setPassword(passwordEncoder.encode(patientDTO.getPassword()));
            }

            Patient updated = patientRepository.save(patient);
            return convertToDTO(updated);
        });
    }

    // DELETE PATIENT
    public boolean deletePatient(Long id) {
        if (patientRepository.existsById(id)) {
            patientRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // FIND BY EMAIL
    public Optional<Patient> findByEmail(String email) {
        return patientRepository.findByEmail(email);
    }
    //  AJOUT : Permet de récupérer directement le DTO via l'email du patient
    public Optional<PatientDTO> getPatientByEmail(String email) {
        return patientRepository.findByEmail(email)
                .map(this::convertToDTO);
    }

    // =========================
    // MAPPING METHODS
    // =========================

    private PatientDTO convertToDTO(Patient patient) {
        return new PatientDTO(
                patient.getId(),
                patient.getName(),
                patient.getEmail(),
                patient.getSocialSecurity(),
                patient.getDoctor() != null ? patient.getDoctor().getName() : null
        );
    }

    private Patient convertToEntity(PatientDTO dto) {
        Patient patient = new Patient();

        patient.setId(dto.getId());
        patient.setName(dto.getName());
        patient.setEmail(dto.getEmail());
        patient.setSocialSecurity(dto.getSocialSecurity());

        if (dto.getPassword() != null) {
            patient.setPassword(dto.getPassword());
        }

        return patient;
    }
}