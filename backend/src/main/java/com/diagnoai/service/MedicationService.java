package com.diagnoai.service;

import com.diagnoai.dto.MedicationDTO;
import com.diagnoai.model.Medication;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.MedicationRepository;
import com.diagnoai.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MedicationService {

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private PatientRepository patientRepository;

    public List<MedicationDTO> getAllMedications() {
        return medicationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MedicationDTO> getMedicationsByPatientId(Long patientId) {
        return medicationRepository.findByPatientId(patientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<MedicationDTO> getMedicationById(Long id) {
        return medicationRepository.findById(id).map(this::convertToDTO);
    }

    public MedicationDTO createMedication(MedicationDTO medicationDTO) {
        Optional<Patient> patient = patientRepository.findById(medicationDTO.getPatientId());
        if (patient.isPresent()) {
            Medication medication = convertToEntity(medicationDTO);
            medication.setPatient(patient.get());
            Medication savedMedication = medicationRepository.save(medication);
            return convertToDTO(savedMedication);
        }
        throw new RuntimeException("Patient not found");
    }

    public Optional<MedicationDTO> updateMedication(Long id, MedicationDTO medicationDTO) {
        return medicationRepository.findById(id).map(medication -> {
            medication.setName(medicationDTO.getName());
            medication.setDosage(medicationDTO.getDosage());
            Medication updatedMedication = medicationRepository.save(medication);
            return convertToDTO(updatedMedication);
        });
    }

    public boolean deleteMedication(Long id) {
        if (medicationRepository.existsById(id)) {
            medicationRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private MedicationDTO convertToDTO(Medication medication) {
        return new MedicationDTO(medication.getId(), medication.getName(), medication.getDosage(), medication.getPatient().getId());
    }

    private Medication convertToEntity(MedicationDTO medicationDTO) {
        Medication medication = new Medication();
        medication.setId(medicationDTO.getId());
        medication.setName(medicationDTO.getName());
        medication.setDosage(medicationDTO.getDosage());
        return medication;
    }
}