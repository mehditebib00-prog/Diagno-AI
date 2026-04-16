package com.diagnoai.dto;

import java.time.LocalDateTime;

public class SymptomDTO {

    private Long id;
    private String description;
    private LocalDateTime date;
    private Long patientId;

    // Constructors
    public SymptomDTO() {}

    public SymptomDTO(Long id, String description, LocalDateTime date, Long patientId) {
        this.id = id;
        this.description = description;
        this.date = date;
        this.patientId = patientId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
}