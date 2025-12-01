package com.example.institution_onboarding.controller;

import com.example.institution_onboarding.dto.InstitutionRequest;
import com.example.institution_onboarding.entity.Institution;
import com.example.institution_onboarding.entity.InstitutionCourse;
import com.example.institution_onboarding.entity.InstitutionDocument;
import com.example.institution_onboarding.service.InstitutionService;

import lombok.RequiredArgsConstructor;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService service;

    // PUBLIC
    @PostMapping("/register")
    public Institution register(@RequestBody InstitutionRequest request) {
        return service.register(request);
    }

    // INSTITUTION ONLY
    @GetMapping("/{id}/status")
    public String getStatus(@PathVariable Long id, HttpServletRequest req) {

        String role = (String) req.getAttribute("role");
        String username = (String) req.getAttribute("username");

        if (!"INSTITUTION".equals(role))
            throw new RuntimeException("Only institutions can view status");

        service.validateInstitutionAccess(id, username);
        return service.getStatus(id).getStatus().toString();
    }

    // ADMIN ONLY
    @PostMapping("/{id}/verify")
    public Institution verifyInstitution(
            @PathVariable Long id,
            @RequestParam boolean approve,
            @RequestParam(required = false) String reason,
            HttpServletRequest req
    ) {
        String role = (String) req.getAttribute("role");
        if (!"ADMIN".equals(role))
            throw new RuntimeException("Only ADMIN can verify institutions");

        return service.verify(id, approve, reason);
    }

    // ADMIN ONLY
    @GetMapping("/{id}/documents")
    public List<InstitutionDocument> getDocuments(
            @PathVariable Long id,
            HttpServletRequest req
    ) {
        String role = (String) req.getAttribute("role");
        if (!"ADMIN".equals(role))
            throw new RuntimeException("Only admin can list documents");

        return service.getDocuments(id);
    }

    // ADMIN ONLY
    @GetMapping("/{institutionId}/documents/{docId}")
    public byte[] downloadDocument(
            @PathVariable Long institutionId,
            @PathVariable Long docId,
            HttpServletRequest req
    ) {
        String role = (String) req.getAttribute("role");
        if (!"ADMIN".equals(role))
            throw new RuntimeException("Only admin can download documents");

        return service.downloadDocument(institutionId, docId);
    }
}
