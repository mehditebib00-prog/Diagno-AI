package com.diagnoai.service;

import com.diagnoai.dto.SymptomDTO;
import com.diagnoai.model.Patient;
import com.diagnoai.model.Symptom;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.repository.SymptomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SymptomService {

    @Autowired
    private SymptomRepository symptomRepository;

    @Autowired
    private PatientRepository patientRepository;

    public List<SymptomDTO> getAllSymptoms() {
        return symptomRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SymptomDTO> getSymptomsByPatientId(Long patientId) {
        return symptomRepository.findByPatientId(patientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<SymptomDTO> getSymptomById(Long id) {
        return symptomRepository.findById(id).map(this::convertToDTO);
    }

    public SymptomDTO createSymptom(SymptomDTO symptomDTO) {
    Patient patient = patientRepository.findById(symptomDTO.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Patient not found with id: " + symptomDTO.getPatientId()));

    Symptom symptom = convertToEntity(symptomDTO);
    symptom.setPatient(patient);
    Symptom savedSymptom = symptomRepository.save(symptom);
    return convertToDTO(savedSymptom);
}

    public Optional<SymptomDTO> updateSymptom(Long id, SymptomDTO symptomDTO) {
        return symptomRepository.findById(id).map(symptom -> {
            symptom.setDescription(symptomDTO.getDescription());
            symptom.setDate(symptomDTO.getDate());
            Symptom updatedSymptom = symptomRepository.save(symptom);
            return convertToDTO(updatedSymptom);
        });
    }

    public boolean deleteSymptom(Long id) {
        if (symptomRepository.existsById(id)) {
            symptomRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private SymptomDTO convertToDTO(Symptom symptom) {
        return new SymptomDTO(symptom.getId(), symptom.getDescription(), symptom.getDate(), symptom.getPatient().getId());
    }

    private Symptom convertToEntity(SymptomDTO symptomDTO) {
        Symptom symptom = new Symptom();
        symptom.setId(symptomDTO.getId());
        symptom.setDescription(symptomDTO.getDescription());
        symptom.setDate(symptomDTO.getDate());
        return symptom;
    }

    // Simple custom exception to represent resource not found scenarios.
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}