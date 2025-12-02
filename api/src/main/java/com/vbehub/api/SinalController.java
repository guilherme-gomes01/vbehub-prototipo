package com.vbehub.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sinais")
@CrossOrigin(origins = "*") // LIBERA O REACT (CORS) - CRUCIAL PARA O MVP
public class SinalController {

    @Autowired
    private SinalRepository repository;

    // Endpoint 1: Retorna a lista completa para o Dashboard/Mapa
    @GetMapping
    public List<SinalProjection> listarTodos() {
        return repository.findAllComLatLong();
    }

    // Endpoint 2: Atualiza o Status (usado quando arrastar o card no Kanban)
    @PutMapping("/{id}/status")
    public void atualizarStatus(@PathVariable Long id, @RequestBody String novoStatus) {
        // Truque sujo para MVP: O body vem cru, ex: "Em Análise".
        // Limpamos aspas se vierem do JSON
        String statusLimpo = novoStatus.replace("\"", "");

        Sinal sinal = repository.findById(id).orElseThrow();
        sinal.setStatus(statusLimpo);
        repository.save(sinal);
    }
}