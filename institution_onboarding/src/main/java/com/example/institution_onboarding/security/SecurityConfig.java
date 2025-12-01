package com.example.institution_onboarding.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;

    // -----------------------------------------------------------------
    @Bean
    public AuthenticationProvider authProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // -----------------------------------------------------------------
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();  // simplified for project
    }

    // -----------------------------------------------------------------
    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // -----------------------------------------------------------------
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/", "/index.html", "/login.html", "/register.html",
                                "/admin.html", "/institution.html", "/style.css", "/script.js").permitAll()

                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/institutions/register").permitAll()


                        // Admin-only routes
                        .requestMatchers("/api/institutions/*/verify").hasAuthority("ADMIN")
                        .requestMatchers("/api/institutions/*/documents").hasAuthority("ADMIN")
                        .requestMatchers("/api/institutions/*/documents/*").hasAuthority("ADMIN")

                        // Everything else requires token
                        .anyRequest().authenticated()
                )

                .formLogin(form -> form.disable())

                .authenticationProvider(authProvider())

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
