package com.pharmacy.controller;

import com.pharmacy.config.ApiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public landing for the service URL (e.g. opening the Render link in a browser).
 * The API itself stays protected; only this root GET is anonymous.
 */
@RestController
@RequiredArgsConstructor
public class RootController {

    private final ApiProperties apiProperties;

    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> root() {
        String p = apiProperties.getPrefix();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "pharmacy-backend");
        body.put("status", "ok");
        body.put("message", "API is running. Use JSON clients or your app with a Bearer token on protected routes.");
        body.put("apiPrefix", p);
        body.put("hints", Map.of(
                "login", "POST " + p + "/auth/login",
                "registerPharmacy", "POST " + p + "/pharmacies/register (multipart)",
                "health", "GET /actuator/health"));
        return body;
    }
}
