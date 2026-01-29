package com.vbehub.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinais")
@CrossOrigin(origins = "*") // LIBERA O REACT (CORS)
public class SinalController {

    @Autowired
    private SinalRepository repository;

    @GetMapping
    public List<SinalProjection> listarTodos() {
        return repository.findAllComLatLong();
    }

    @PutMapping("/{id}/status")
    public void atualizarStatus(@PathVariable Long id, @RequestBody String novoStatus) {
        // Limpa aspas se vier do JSON
        String statusLimpo = novoStatus.replace("\"", "");

        Sinal sinal = repository.findById(id).orElseThrow();
        sinal.setStatus(statusLimpo);
        repository.save(sinal);
    }

    @GetMapping("/stats/risco")
    public List<Map<String, Object>> getEstatisticasRisco() {
        List<Object[]> resultados = repository.countByNivelRisco();

        // Transforma a lista crua [Object, Object] em um JSON
        return resultados.stream().map(obj -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", obj[0]);  // Ex: "Alto"
            map.put("value", obj[1]); // Ex: 15
            return map;
        }).toList();
    }

    @GetMapping("/stats/status")
    public List<Map<String, Object>> getEstatisticasStatus() {
        List<Object[]> resultados = repository.countByStatus();

        return resultados.stream().map(obj -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", obj[0]);
            map.put("value", obj[1]);
            return map;
        }).toList();
    }
}