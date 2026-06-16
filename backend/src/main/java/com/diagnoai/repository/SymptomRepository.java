package com.diagnoai.repository;

import com.diagnoai.model.Symptom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SymptomRepository extends JpaRepository<Symptom, Long> {


    @Query("SELECT s FROM Symptom s WHERE s.patient.id = :patientId")
    List<Symptom> findByPatientId(@Param("patientId") Long patientId);
}