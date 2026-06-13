package com.diagnoai.dto; // Vérifie que le nom du package correspond à ton projet

public class PatientDTO {

    private Long id;
    private String name;
    private String email;
    private String socialSecurity;
    private Long doctorId; // 🥼 Inclus pour faire le lien avec son médecin

    // Constructeur par défaut (nécessaire pour Jackson)
    public PatientDTO() {
    }

    // Constructeur complet
    public PatientDTO(Long id, String name, String email, String socialSecurity, Long doctorId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.socialSecurity = socialSecurity;
        this.doctorId = doctorId;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSocialSecurity() {
        return socialSecurity;
    }

    public void setSocialSecurity(String socialSecurity) {
        this.socialSecurity = socialSecurity;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }
}