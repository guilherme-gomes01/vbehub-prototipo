package com.vbehub.api;

import java.time.LocalDateTime;

public interface SinalProjection {
    Long getId();
    String getTitulo();
    String getDescricao();
    LocalDateTime getDataDeteccao();
    String getStatus();
    String getNivelRisco();
    String getLocalizacaoBairro();
    String getNomeFonte(); // Vem do JOIN
    Double getLatitude();  // Vem do PostGIS
    Double getLongitude(); // Vem do PostGIS
}