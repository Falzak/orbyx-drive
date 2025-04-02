
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import enJSON from "./locales/en.json" assert { type: "json" };
import ptBRJSON from "./locales/pt-BR.json" assert { type: "json" };

i18n
  .use(LanguageDetector)  // Add language detector
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enJSON,
      },
      "pt-BR": {
        translation: ptBRJSON,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    debug: process.env.NODE_ENV === "development",
  });

export default i18n;
