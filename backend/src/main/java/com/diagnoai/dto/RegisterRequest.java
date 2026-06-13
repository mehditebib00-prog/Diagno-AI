package com.diagnoai.dto; // Vérifie que le package correspond à ton projet (ex: com.diagnoai.payload ou dto)

public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private String role; // "PATIENT" ou "DOCTOR"

    // Champs optionnels ou spécifiques selon le rôle
    private String socialSecurity; // Pour le patient
    private String specialization;   // Pour le médecin

    // Constructeur par défaut (Obligatoire pour la désérialisation JSON de Jackson)
    public RegisterRequest() {
    }

    // Constructeur complet
    public RegisterRequest(String name, String email, String password, String role, String socialSecurity, String specialization) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.socialSecurity = socialSecurity;
        this.specialization = specialization;
    }

    // Getters et Setters
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getSocialSecurity() {
        return socialSecurity;
    }

    public void setSocialSecurity(String socialSecurity) {
        this.socialSecurity = socialSecurity;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }
}