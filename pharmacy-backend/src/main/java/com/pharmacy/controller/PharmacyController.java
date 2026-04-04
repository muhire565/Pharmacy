package com.pharmacy.controller;

import com.pharmacy.dto.PharmacyResponse;
import com.pharmacy.security.SecurityUtils;
import com.pharmacy.service.PharmacyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("${app.api.prefix}/pharmacies")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyProfileService pharmacyProfileService;

    @GetMapping("/me")
    public PharmacyResponse me() {
        return pharmacyProfileService.getMine();
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public PharmacyResponse updateMe(
            @RequestParam String pharmacyName,
            @RequestParam String countryCode,
            @RequestParam String phone,
            @RequestParam String email,
            @RequestParam String address,
            @RequestParam(required = false) String currencyCode,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {
        return pharmacyProfileService.updateMine(
                pharmacyName, countryCode, phone, email, address, currencyCode, logo);
    }

    @GetMapping("/me/logo")
    public ResponseEntity<Resource> myLogo() throws Exception {
        Resource resource = pharmacyProfileService.loadLogoForPharmacy(SecurityUtils.currentPharmacyId());
        return logoResponse(resource);
    }

    @GetMapping("/{id:\\d+}")
    public PharmacyResponse getById(@PathVariable Long id) {
        requireOwnPharmacy(id);
        return pharmacyProfileService.getMine();
    }

    @PutMapping(value = "/{id:\\d+}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PHARMACY_ADMIN')")
    public PharmacyResponse updateById(
            @PathVariable Long id,
            @RequestParam String pharmacyName,
            @RequestParam String countryCode,
            @RequestParam String phone,
            @RequestParam String email,
            @RequestParam String address,
            @RequestParam(required = false) String currencyCode,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {
        requireOwnPharmacy(id);
        return pharmacyProfileService.updateMine(
                pharmacyName, countryCode, phone, email, address, currencyCode, logo);
    }

    private void requireOwnPharmacy(Long id) {
        if (!id.equals(SecurityUtils.currentPharmacyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another pharmacy");
        }
    }

    private static ResponseEntity<Resource> logoResponse(Resource resource) throws Exception {
        Path path = resource.getFile().toPath();
        String probe = Files.probeContentType(path);
        MediaType mediaType = probe != null ? MediaType.parseMediaType(probe) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
