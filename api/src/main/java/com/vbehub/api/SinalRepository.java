package com.vbehub.api;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SinalRepository extends JpaRepository<Sinal, Long> {

    // Query que busca tudo, faz o JOIN com a Fonte e extrai Lat/Long do geom
    @Query(value = """
        SELECT 
            s.id as id, 
            s.titulo as titulo, 
            s.descricao as descricao, 
            s.data_deteccao as dataDeteccao, 
            s.status as status, 
            s.nivel_risco as nivelRisco, 
            s.localizacao_bairro as localizacaoBairro,
            f.nome as nomeFonte,
            ST_Y(s.geom) as latitude,
            ST_X(s.geom) as longitude
        FROM sinal s
        LEFT JOIN fonte f ON s.fonte_id = f.id
        ORDER BY s.data_deteccao DESC
    """, nativeQuery = true)
    List<SinalProjection> findAllComLatLong();

    List<Sinal> findByStatus(String status);

    // Conta quantos sinais existem por Nível de Risco
    @Query("SELECT s.nivelRisco, COUNT(s) FROM Sinal s GROUP BY s.nivelRisco")
    List<Object[]> countByNivelRisco();

    // Conta quantos sinais existem por Status (Kanban)
    @Query("SELECT s.status, COUNT(s) FROM Sinal s GROUP BY s.status")
    List<Object[]> countByStatus();
}