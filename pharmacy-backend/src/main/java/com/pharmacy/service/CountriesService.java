package com.pharmacy.service;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.pharmacy.dto.CountryOptionDto;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class CountriesService {

    private static final PhoneNumberUtil PHONE = PhoneNumberUtil.getInstance();

    public List<CountryOptionDto> listCountries() {
        return PHONE.getSupportedRegions().stream()
                .sorted(Comparator.comparing(r -> new Locale("", r).getDisplayCountry(Locale.ENGLISH)))
                .map(region -> {
                    int code = PHONE.getCountryCodeForRegion(region);
                    return new CountryOptionDto(
                            region,
                            new Locale("", region).getDisplayCountry(Locale.ENGLISH),
                            code > 0 ? "+" + code : ""
                    );
                })
                .filter(c -> !c.dialCode().isEmpty())
                .toList();
    }
}
