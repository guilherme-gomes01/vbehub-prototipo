package com.vbehub.api.repository;

import com.vbehub.api.model.Analista;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnalistaRepository extends JpaRepository<Analista, Long> {
    Optional<Analista> findByEmail(String email);
}