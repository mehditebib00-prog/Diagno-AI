package com.diagnoai.controller;

import com.diagnoai.dto.AppointmentDTO;
import com.diagnoai.model.Doctor;
import com.diagnoai.repository.DoctorRepository;
import com.diagnoai.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorRepository doctorRepository; // On injecte le repository ici

    @GetMapping
    public ResponseEntity<List<AppointmentDTO>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatientId(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AppointmentDTO> createAppointment(@RequestBody AppointmentDTO appointmentDTO) {
        AppointmentDTO createdAppointment = appointmentService.createAppointment(appointmentDTO);
        return ResponseEntity.ok(createdAppointment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDTO> updateAppointment(@PathVariable Long id, @RequestBody AppointmentDTO appointmentDTO) {
        return appointmentService.updateAppointment(id, appointmentDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        if (appointmentService.deleteAppointment(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // 🚀 ROUTE CORRIGÉE : Elle va chercher les vrais noms des médecins de la BDD !
    @GetMapping("/doctors-list")
    public ResponseEntity<List<String>> getDoctorsList() {
        List<String> trueDoctors = doctorRepository.findAll().stream()
                .map(Doctor::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(trueDoctors);
    }

    // 🚀 AJOUTE CETTE ROUTE dans AppointmentController.java
    @GetMapping("/doctor/{doctorName}")
    public ResponseEntity<List<AppointmentDTO>> getAppointmentsByDoctor(@PathVariable String doctorName) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctorName(doctorName));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AppointmentDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status, rejectionReason));
    }
}


