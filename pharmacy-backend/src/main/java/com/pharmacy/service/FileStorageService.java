package com.pharmacy.service;

import com.pharmacy.config.FileStorageProperties;
import com.pharmacy.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg");

    private final FileStorageProperties properties;

    public String savePharmacyLogo(Long pharmacyId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Logo file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessRuleException("Logo must be PNG or JPEG");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessRuleException("Logo must not exceed 2MB");
        }
        String ext = contentType.toLowerCase(Locale.ROOT).contains("png") ? "png" : "jpg";
        try {
            Path root = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
            Path dir = root.resolve(String.valueOf(pharmacyId));
            Files.createDirectories(dir);
            Path target = dir.resolve("logo." + ext).normalize();
            if (!target.startsWith(root)) {
                throw new BusinessRuleException("Invalid path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return pharmacyId + "/logo." + ext;
        } catch (IOException e) {
            throw new BusinessRuleException("Could not store logo: " + e.getMessage());
        }
    }

    public Path resolveLogoPath(String relativePath) {
        Path root = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Path file = root.resolve(relativePath).normalize();
        if (!file.startsWith(root)) {
            throw new BusinessRuleException("Invalid logo path");
        }
        return file;
    }
}
