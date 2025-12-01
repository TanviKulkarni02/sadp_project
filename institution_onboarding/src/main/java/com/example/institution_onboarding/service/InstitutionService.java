package com.example.institution_onboarding.service;

import com.example.institution_onboarding.dto.InstitutionRequest;
import com.example.institution_onboarding.entity.*;
import com.example.institution_onboarding.exception.NotFoundException;
import com.example.institution_onboarding.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final InstitutionCourseRepository courseRepository;
    private final InstitutionDocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ------------------------------------------------------------
    public Institution register(InstitutionRequest request) {

        Institution institution = Institution.builder()
                .name(request.getName())
                .type(request.getType())
                .email(request.getEmail())
                .phone(request.getPhone())
                .registrationNumber(request.getRegistrationNumber())
                .address(request.getAddress())
                .website(request.getWebsite())
                .status(Status.PENDING)
                .build();

        Institution saved = institutionRepository.save(institution);

        User user = User.builder()
                .username(request.getEmail())
                .password(request.getPhone())
                .role(UserRole.INSTITUTION)
                .build();

        userRepository.save(user);

        return saved;
    }

    // ------------------------------------------------------------
    public Institution getStatus(Long id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Institution not found"));
    }

    // ------------------------------------------------------------
    public Institution verify(Long id, boolean approve, String reason) {

        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Institution not found"));

        if (approve) {
            inst.setStatus(Status.APPROVED);
            inst.setRejectionReason(null);
        } else {
            inst.setStatus(Status.REJECTED);
            inst.setRejectionReason(reason);
        }

        return institutionRepository.save(inst);
    }

    // ------------------------------------------------------------
    public List<InstitutionDocument> getDocuments(Long id) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Institution not found"));
        return documentRepository.findByInstitution(inst);
    }

    // ------------------------------------------------------------
    public byte[] downloadDocument(Long institutionId, Long docId) {

        InstitutionDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        try {
            return Files.readAllBytes(new File(doc.getFilePath()).toPath());
        } catch (Exception e) {
            throw new RuntimeException("Unable to read file");
        }
    }

    // ------------------------------------------------------------
    public void validateInstitutionAccess(Long id, String username) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institution not found"));

        if (!inst.getEmail().equals(username)) {
            throw new RuntimeException("Access denied");
        }
    }
}
