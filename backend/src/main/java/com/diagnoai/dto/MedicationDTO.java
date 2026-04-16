package com.diagnoai.dto;

public class MedicationDTO {

    private Long id;
    private String name;
    private String dosage;
    private Long patientId;

    // Constructors
    public MedicationDTO() {}

    public MedicationDTO(Long id, String name, String dosage, Long patientId) {
        this.id = id;
        this.name = name;
        this.dosage = dosage;
        this.patientId = patientId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
}