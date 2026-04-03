package com.pharmacy.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import com.pharmacy.exception.BusinessRuleException;
import org.springframework.stereotype.Service;

@Service
public class PhoneValidationService {

    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

    public String toE164(String countryCodeIso2, String phoneDigits) {
        String raw = phoneDigits == null ? "" : phoneDigits.trim();
        if (raw.isEmpty()) {
            throw new BusinessRuleException("Phone number is required");
        }
        try {
            Phonenumber.PhoneNumber parsed = UTIL.parse(raw, countryCodeIso2.toUpperCase());
            if (!UTIL.isValidNumberForRegion(parsed, countryCodeIso2.toUpperCase())) {
                throw new BusinessRuleException("Phone number is not valid for the selected country");
            }
            return UTIL.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw new BusinessRuleException("Invalid phone number: " + e.getMessage());
        }
    }
}
