
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from "./locales/en.json" assert { type: "json" };
import ptBRJSON from "./locales/pt-BR.json" assert { type: "json" };
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
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
    lng: window.navigator.language === 'pt-BR' ? 'pt-BR' : 'en',
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    debug: process.env.NODE_ENV === "development",
  });

export default i18n;
// Do not directly export t, use useTranslation hook instead
