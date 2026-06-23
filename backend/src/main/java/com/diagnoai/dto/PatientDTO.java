package com.diagnoai.dto;

import com.diagnoai.model.Patient;

public class PatientDTO {

    private Long id;
    private String name;
    private String email;
    private String password;
    private String socialSecurity;
    private String doctorName;
    private String profilePicture;

    // Constructors
    public PatientDTO() {}



    public PatientDTO(Long id, String name, String email, String socialSecurity, String doctorName, String profilePicture) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.socialSecurity = socialSecurity;
        this.doctorName = doctorName;
        this.profilePicture = profilePicture;
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
    public void setSocialSecurity(String socialSecurity) { this.socialSecurity = socialSecurity; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
}
