import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en.json";
import rw from "@/locales/rw.json";
import fr from "@/locales/fr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "rw", label: "Ikinyarwanda" },
  { code: "fr", label: "Français" },
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      rw: { translation: rw },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "rw", "fr"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "pharmacy-i18n-lang",
    },
  });

export default i18n;
