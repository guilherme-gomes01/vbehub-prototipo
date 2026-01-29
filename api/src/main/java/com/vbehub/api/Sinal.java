package com.vbehub.api;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sinal")
public class Sinal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data_deteccao")
    private LocalDateTime dataDeteccao;

    private String status; // 'Pendente', 'Em Análise', etc.

    @Column(name = "nivel_risco")
    private String nivelRisco;

    @Column(name = "localizacao_bairro")
    private String localizacaoBairro;


    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public LocalDateTime getDataDeteccao() { return dataDeteccao; }
    public void setDataDeteccao(LocalDateTime dataDeteccao) { this.dataDeteccao = dataDeteccao; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNivelRisco() { return nivelRisco; }
    public void setNivelRisco(String nivelRisco) { this.nivelRisco = nivelRisco; }
    public String getLocalizacaoBairro() { return localizacaoBairro; }
    public void setLocalizacaoBairro(String localizacaoBairro) { this.localizacaoBairro = localizacaoBairro; }
}