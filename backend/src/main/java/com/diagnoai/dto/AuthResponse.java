package com.diagnoai.dto;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private String id;
    private String email;
    private String name;

    // Constructors
    public AuthResponse() {}

    public AuthResponse(String token, Long id, String email, String name) {
        this.token = token;
        this.id = String.valueOf(id);
        this.email = email;
        this.name = name;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}