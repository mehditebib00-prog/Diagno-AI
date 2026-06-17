package com.diagnoai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "patients") // Nom de ta table dans MySQL
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // 🔑 Ajouté !

    @Column(name = "social_security", nullable = false)
    private String socialSecurity;

    @Column(name = "doctor_id") // 🥼 Ajouté ! Liaison vers l'id du médecin concerné
    private Long doctorId;

    // Constructeurs
    public Patient() {
    }

    public Patient(String name, String email, String password, String socialSecurity, Long doctorId) {
        this.name = name;
        this.email = email;
        this.password = password;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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