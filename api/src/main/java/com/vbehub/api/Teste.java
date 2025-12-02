package com.vbehub.api;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sinal")
@Data // Gera Getters, Setters, toString, equals e hashCode automaticamente
@NoArgsConstructor // Gera o construtor vazio (obrigatório para o JPA)
@AllArgsConstructor // Gera o construtor com todos os argumentos
public class Teste {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data_deteccao")
    private LocalDateTime dataDeteccao;

    private String status;

    @Column(name = "nivel_risco")
    private String nivelRisco;

    @Column(name = "localizacao_bairro")
    private String localizacaoBairro;

    // Note que não existem mais linhas de código abaixo.
    // O Lombok gera tudo em tempo de compilação.
}