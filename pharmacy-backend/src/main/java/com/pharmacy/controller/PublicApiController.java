package com.pharmacy.controller;

import com.pharmacy.dto.CountryOptionDto;
import com.pharmacy.service.CountriesService;
import com.pharmacy.service.PharmacyProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("${app.api.prefix}/public")
@RequiredArgsConstructor
public class PublicApiController {

    private final CountriesService countriesService;
    private final PharmacyProfileService pharmacyProfileService;

    @GetMapping("/countries")
    public List<CountryOptionDto> countries() {
        return countriesService.listCountries();
    }

    @GetMapping("/pharmacies/{id}/logo")
    public ResponseEntity<Resource> pharmacyLogo(@PathVariable Long id) throws Exception {
        Resource resource = pharmacyProfileService.loadLogoForPharmacy(id);
        Path path = resource.getFile().toPath();
        String probe = Files.probeContentType(path);
        MediaType mediaType = probe != null ? MediaType.parseMediaType(probe) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
