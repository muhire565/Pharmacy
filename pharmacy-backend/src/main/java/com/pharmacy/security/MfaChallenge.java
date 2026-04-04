package com.pharmacy.security;

public record MfaChallenge(Long userId, String email) {}
