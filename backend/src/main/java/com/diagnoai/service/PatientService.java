package com.diagnoai.service;

import com.diagnoai.model.Patient;
import com.diagnoai.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    @Autowired
    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    /**
     * Récupère tous les patients de la base de données.
     */
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    /**
     * Trouve un patient par son ID.
     */
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    /**
     * Trouve un patient par son adresse email.
     * Utile pour la reconnexion et la synchronisation du profil mobile.
     */
    public Optional<Patient> getPatientByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    /**
     * Enregistre ou met à jour un patient.
     */
    public Patient savePatient(Patient patient) {
        // Optionnel : ajouter des vérifications ici (ex: vérifier si l'email existe déjà)
        return patientRepository.save(patient);
    }

    /**
     * Supprime un patient de la base de données.
     */
    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new RuntimeException("Patient introuvable avec l'ID : " + id);
        }
        patientRepository.deleteById(id);
    }
}