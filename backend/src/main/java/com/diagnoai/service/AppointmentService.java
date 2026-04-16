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
        Optional<Patient> patient = patientRepository.findById(appointmentDTO.getPatientId());
        if (patient.isPresent()) {
            Appointment appointment = convertToEntity(appointmentDTO);
            appointment.setPatient(patient.get());
            Appointment savedAppointment = appointmentRepository.save(appointment);
            return convertToDTO(savedAppointment);
        }
        throw new RuntimeException("Patient not found");
    }

    public Optional<AppointmentDTO> updateAppointment(Long id, AppointmentDTO appointmentDTO) {
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setDate(appointmentDTO.getDate());
            appointment.setDoctorName(appointmentDTO.getDoctorName());
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
        return new AppointmentDTO(appointment.getId(), appointment.getDate(), appointment.getDoctorName(), appointment.getPatient().getId());
    }

    private Appointment convertToEntity(AppointmentDTO appointmentDTO) {
        Appointment appointment = new Appointment();
        appointment.setId(appointmentDTO.getId());
        appointment.setDate(appointmentDTO.getDate());
        appointment.setDoctorName(appointmentDTO.getDoctorName());
        return appointment;
    }
}