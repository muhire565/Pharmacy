package com.pharmacy.service;

import com.pharmacy.config.AppMailProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailDispatchService {

    private final AppMailProperties appMailProperties;
    private final ObjectProvider<JavaMailSender> mailSender;

    public void sendEmailVerification(String toEmail, String rawToken) {
        String link = appMailProperties.getFrontendBaseUrl() + "/verify-email?token=" + rawToken;
        String text =
                "Verify your NexPharm account by opening this link (valid 48 hours):\n\n"
                        + link
                        + "\n\nIf you did not register, ignore this email.";
        send(toEmail, "Verify your email", text);
    }

    public void sendPasswordReset(String toEmail, String rawToken) {
        String link = appMailProperties.getFrontendBaseUrl() + "/reset-password?token=" + rawToken;
        String text =
                "Reset your NexPharm password using this link (valid 1 hour):\n\n"
                        + link
                        + "\n\nIf you did not request a reset, ignore this email.";
        send(toEmail, "Reset your password", text);
    }

    private void send(String to, String subject, String text) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("[email skipped — no JavaMailSender] to={} subject={}\n{}", to, subject, text);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(appMailProperties.getFrom());
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            sender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            log.info("[email fallback log] to={} subject={}\n{}", to, subject, text);
        }
    }
}
