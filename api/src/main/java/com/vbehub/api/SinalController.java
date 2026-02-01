package com.vbehub.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinais")
public class SinalController {

    private static final Logger log = LoggerFactory.getLogger(SinalController.class);

    @Autowired
    private SinalRepository repository;

    @GetMapping
    public List<SinalProjection> listarTodos() {
        List<SinalProjection> sinais = repository.findAllComLatLong();
        log.info("Listagem de sinais retornou {} registros", sinais.size());
        return sinais;
    }

    @PutMapping("/{id}/status")
    public void atualizarStatus(@PathVariable Long id, @RequestBody String novoStatus) {
        String statusLimpo = novoStatus.replace("\"", "");

        Sinal sinal = repository.findById(id).orElseThrow();
        String statusAnterior = sinal.getStatus();
        sinal.setStatus(statusLimpo);
        repository.save(sinal);

        log.info("Sinal {} atualizado: {} -> {}", id, statusAnterior, statusLimpo);
    }

    @GetMapping("/stats/risco")
    public List<Map<String, Object>> getEstatisticasRisco() {
        List<Object[]> resultados = repository.countByNivelRisco();

        return resultados.stream().map(obj -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", obj[0]);
            map.put("value", obj[1]);
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