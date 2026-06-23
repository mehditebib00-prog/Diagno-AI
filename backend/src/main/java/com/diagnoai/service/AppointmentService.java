package com.diagnoai.service;

import com.diagnoai.dto.AppointmentDTO;
import com.diagnoai.model.Appointment;
import com.diagnoai.model.Patient;
import com.diagnoai.repository.AppointmentRepository;
import com.diagnoai.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<AppointmentDTO> getAppointmentById(Long id) {
        return appointmentRepository.findById(id).map(this::convertToDTO);
    }

    public AppointmentDTO createAppointment(AppointmentDTO appointmentDTO) {
        Optional<Patient> patientOpt = patientRepository.findById(appointmentDTO.getPatientId());
        if (patientOpt.isPresent()) {
            Appointment appointment = convertToEntity(appointmentDTO);
            appointment.setPatient(patientOpt.get());

            // 🚀 CORRECTION : On prend le nom du médecin envoyé par le mobile, pas le premier de la BDD !
            appointment.setDoctorName(appointmentDTO.getDoctorName());

            if (appointment.getStatus() == null) {
                appointment.setStatus("PENDING");
            }

            // Lier aussi le patient à ce médecin si ce n'est pas déjà fait
            Patient patient = patientOpt.get();
            if (patient.getDoctor() == null) {
                // Optionnel : Tu peux chercher le Doctor par son nom ici si tu veux lier l'entité Doctor
                // Pour l'instant, l'important est que la table "appointments" ait le bon doctorName !
            }

            Appointment savedAppointment = appointmentRepository.save(appointment);
            return convertToDTO(savedAppointment);
        }
        throw new RuntimeException("Patient non trouvé");
    }

    public Optional<AppointmentDTO> updateAppointment(Long id, AppointmentDTO appointmentDTO) {
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setDate(appointmentDTO.getDate());
            appointment.setDoctorName(appointmentDTO.getDoctorName());
            appointment.setStatus(appointmentDTO.getStatus()); // ✅ Prise en compte du statut
            Appointment updatedAppointment = appointmentRepository.save(appointment);
            return convertToDTO(updatedAppointment);
        });
    }

    public boolean deleteAppointment(Long id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO(
                appointment.getId(),
                appointment.getDate(),
                appointment.getDoctorName(),
                appointment.getStatus(),
                appointment.getPatient().getId()
        );
        dto.setRejectionReason(appointment.getRejectionReason());
        dto.setPatientName(appointment.getPatient().getName());

        return dto;
    }

    private Appointment convertToEntity(AppointmentDTO appointmentDTO) {
        Appointment appointment = new Appointment();
        appointment.setId(appointmentDTO.getId());
        appointment.setDate(appointmentDTO.getDate());
        appointment.setDoctorName(appointmentDTO.getDoctorName());
        appointment.setStatus(appointmentDTO.getStatus()); // ✅
        return appointment;
    }


    public List<AppointmentDTO> getAppointmentsByDoctorName(String doctorName) {
        // 🚀 Utilise la version IgnoreCase pour éviter les bugs de majuscules/espaces !
        return appointmentRepository.findByDoctorNameIgnoreCase(doctorName.trim()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO updateAppointmentStatus(Long id, String status, String rejectionReason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        appointment.setStatus(status);
        if ("REFUSED".equals(status)) {
            appointment.setRejectionReason(rejectionReason);
        } else {
            appointment.setRejectionReason(null); // Nettoyer si accepté
        }

        Appointment updated = appointmentRepository.save(appointment);
        return convertToDTO(updated);
    }
}