package com.pharmacy.controller;

import com.pharmacy.dto.PharmacyResponse;
import com.pharmacy.service.PharmacyRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("${app.api.prefix}/pharmacies")
@RequiredArgsConstructor
public class PharmacyRegistrationController {

    private final PharmacyRegistrationService registrationService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PharmacyResponse register(
            @RequestParam String pharmacyName,
            @RequestParam String countryCode,
            @RequestParam String phone,
            @RequestParam String email,
            @RequestParam String address,
            @RequestParam String adminPassword,
            @RequestParam(required = false) String currencyCode,
            @RequestPart("logo") MultipartFile logo) {
        return registrationService.register(
                pharmacyName, countryCode, phone, email, address, adminPassword, currencyCode, logo);
    }
}
