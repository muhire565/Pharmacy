package com.pharmacy.security;

import com.pharmacy.config.JwtProperties;
import com.pharmacy.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    public String createToken(Long userId, String email, Long pharmacyId, Role role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtProperties.getExpirationMs());
        return Jwts.builder()
                .subject(email)
                .claim("uid", userId)
                .claim("pharmacyId", pharmacyId)
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(exp)
                .signWith(signingKey())
                .compact();
    }

    public Authentication toAuthentication(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        String email = claims.getSubject();
        Long userId = claims.get("uid", Long.class);
        Long pharmacyId = claims.get("pharmacyId", Long.class);
        String roleName = claims.get("role", String.class);
        Role role = Role.valueOf(roleName);
        PharmacyUserDetails principal = new PharmacyUserDetails(userId, pharmacyId, email, "", role);
        return new UsernamePasswordAuthenticationToken(principal, token, principal.getAuthorities());
    }

    public boolean validate(String token) {
        try {
            Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private SecretKey signingKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
