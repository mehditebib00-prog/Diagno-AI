package com.diagnoai.dto;

import java.time.LocalDateTime;

public class AppointmentDTO {

    private Long id;
    private LocalDateTime date;
    private String doctorName;
    private Long patientId;
    private String status;
    private String rejectionReason;

    public AppointmentDTO() {}

    public AppointmentDTO(Long id, LocalDateTime date, String doctorName, String status, Long patientId) {
        this.id = id;
        this.date = date;
        this.doctorName = doctorName;
        this.status = status;
        this.patientId = patientId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getStatus() { return status; } // ✅
    public void setStatus(String status) { this.status = status; } // ✅

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}