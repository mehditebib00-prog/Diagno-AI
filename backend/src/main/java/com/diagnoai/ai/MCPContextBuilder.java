// package com.diagnoai.ai;
// import com.diagnoai.model.Patient;
// import com.diagnoai.model.Symptom;
// import com.diagnoai.repository.PatientRepository;
// import com.diagnoai.repository.SymptomRepository;
// import org.springframework.ai.tool.annotation.Tool;
// import org.springframework.ai.tool.annotation.ToolParam;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Component;

// import java.util.List;

// @Component
// public class MCPContextBuilder {

//     @Autowired
//     private PatientRepository patientRepository;

//     @Autowired
//     private SymptomRepository symptomRepository;

//     @Tool(
//         name = "get_patient_context",
//         description = "Fetch patient information and symptoms using a patient ID"
//     )
//     public String getPatientContext(
//             @ToolParam(description = "ID of the patient")
//             Long patientId
//     ) {
//         Patient patient = patientRepository.findById(patientId)
//                 .orElseThrow(() -> new RuntimeException("Patient not found"));

//         List<Symptom> symptoms = symptomRepository.findByPatientId(patientId);

//         StringBuilder context = new StringBuilder();
//         context.append("Patient: ")
//                 .append(patient.getName())
//                 .append(", Email: ")
//                 .append(patient.getEmail())
//                 .append("\n");

//         context.append("Symptoms:\n");

//         for (Symptom symptom : symptoms) {
//             context.append("- ")
//                     .append(symptom.getDescription())
//                     .append(" (")
//                     .append(symptom.getDate())
//                     .append(")\n");
//         }

//         return context.toString();
//     }
// }