package com.diagnoai.ai;

import com.diagnoai.model.Patient;
import com.diagnoai.model.Symptom;
import com.diagnoai.repository.PatientRepository;
import com.diagnoai.repository.SymptomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MCPContextBuilder {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private SymptomRepository symptomRepository;

    public String buildContext(Long patientId) {
        Patient patient = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        List<Symptom> symptoms = symptomRepository.findByPatientId(patientId);

        StringBuilder context = new StringBuilder();
        context.append("Patient: ").append(patient.getName()).append(", Email: ").append(patient.getEmail()).append("\n");
        context.append("Symptoms:\n");
        for (Symptom symptom : symptoms) {
            context.append("- ").append(symptom.getDescription()).append(" (").append(symptom.getDate()).append(")\n");
        }

        return context.toString();
    }
}