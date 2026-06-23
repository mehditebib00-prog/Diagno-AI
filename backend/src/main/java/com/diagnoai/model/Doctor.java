package com.diagnoai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "doctors") // Optionnel : pour donner un nom propre à ta table SQL
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Permet l'auto-incrémentation de l'ID en BDD
    private int id; // Si tes autres relations ou Repositories attendent un Long, tu peux changer 'int' en 'Long'
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    private String name;
    private String specialization;
    private String email;
    private String password;

    // Constructeur vide obligatoire pour JPA
    public Doctor() {
    }

    public Doctor(String name, String specialization, int id, String email, String password,  String profilePicture) {
        this.name = name;
        this.specialization = specialization;
        this.id = id;
        this.email = email;
        this.password = password;
        this.profilePicture = profilePicture;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
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

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}