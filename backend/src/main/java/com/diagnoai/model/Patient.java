package com.diagnoai.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String password;
    private String socialSecurity;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Symptom> symptoms = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Medication> medications = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Appointment> appointments = new ArrayList<>();

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    public Patient() {}

    public Patient(String name, String email, String password, String socialSecurity) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.socialSecurity = socialSecurity;
    }

    // Getters and Setters

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }

    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }

    public String getSocialSecurity() { return socialSecurity; }

    public void setSocialSecurity(String socialSecurity) {
        this.socialSecurity = socialSecurity;
    }

    public List<Symptom> getSymptoms() { return symptoms; }

    public void setSymptoms(List<Symptom> symptoms) { this.symptoms = symptoms; }

    public List<Medication> getMedications() { return medications; }

    public void setMedications(List<Medication> medications) { this.medications = medications; }

    public List<Appointment> getAppointments() { return appointments; }

    public void setAppointments(List<Appointment> appointments) { this.appointments = appointments; }

    public Doctor getDoctor() { return doctor; }

    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
}