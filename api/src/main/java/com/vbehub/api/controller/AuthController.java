package com.vbehub.api.controller;

import com.vbehub.api.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciais) {
        String email = credenciais.get("email");
        String senha = credenciais.get("senha");

        try {
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, senha)
            );

            
            UserDetails usuarioLogado = (UserDetails) authentication.getPrincipal();

           
            String token = jwtService.generateToken(usuarioLogado);

            
            return ResponseEntity.ok(Map.of("token", token));

        } catch (AuthenticationException e) {
            //
            e.printStackTrace();
            System.out.println("ERRO DE AUTENTICAÇÃO: " + e.getMessage());

            return ResponseEntity.status(401).body("Email ou senha inválidos!");
        }
    }
}