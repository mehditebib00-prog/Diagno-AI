package com.diagnoai.repository;

import com.diagnoai.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByEmail(String email);

    // 💡 MODIFICATION : Rechercher tous les patients dont le nom CONTIENT le texte (ex: "du" trouvera "Dupont")
    List<Patient> findByNameContainingIgnoreCase(String name);
}