package com.pharmacy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.mail")
public class AppMailProperties {

    /** Public web app origin (no trailing slash), used in email links */
    private String frontendBaseUrl = "http://localhost:5173";

    /** From header for outbound mail */
    private String from = "NexPharm <noreply@localhost>";
}
