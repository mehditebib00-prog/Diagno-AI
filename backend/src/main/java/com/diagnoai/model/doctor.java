package com.diagnoai.model;

public class doctor {
    private String name;
    private String specialization;

    // Constructors
    public doctor() {}

    public doctor(String name, String specialization) {
        this.name = name;
        this.specialization = specialization;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
}
