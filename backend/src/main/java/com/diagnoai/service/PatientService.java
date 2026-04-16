package com.diagnoai.service;

import com.diagnoai.dto.PatientDTO;
import com.diagnoai.model.Patient;
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
    private PasswordEncoder passwordEncoder;

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<PatientDTO> getPatientById(Long id) {
        return patientRepository.findById(id).map(this::convertToDTO);
    }

    public PatientDTO createPatient(PatientDTO patientDTO) {
        Patient patient = convertToEntity(patientDTO);
        patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        Patient savedPatient = patientRepository.save(patient);
        return convertToDTO(savedPatient);
    }

    public Optional<PatientDTO> updatePatient(Long id, PatientDTO patientDTO) {
        return patientRepository.findById(id).map(patient -> {
            patient.setName(patientDTO.getName());
            patient.setEmail(patientDTO.getEmail());
            Patient updatedPatient = patientRepository.save(patient);
            return convertToDTO(updatedPatient);
        });
    }

    public boolean deletePatient(Long id) {
        if (patientRepository.existsById(id)) {
            patientRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Optional<Patient> findByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    private PatientDTO convertToDTO(Patient patient) {
        return new PatientDTO(patient.getId(), patient.getName(), patient.getEmail());
    }

    private Patient convertToEntity(PatientDTO patientDTO) {
        Patient patient = new Patient();
        patient.setId(patientDTO.getId());
        patient.setName(patientDTO.getName());
        patient.setEmail(patientDTO.getEmail());
        if (patientDTO.getPassword() != null) {
            patient.setPassword(patientDTO.getPassword());
        }
        return patient;
    }
}