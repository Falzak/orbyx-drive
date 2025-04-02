
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from "./locales/en.json" assert { type: "json" };
import ptBRJSON from "./locales/pt-BR.json" assert { type: "json" };

// Try to get stored language from localStorage
const storedLanguage = localStorage.getItem('language') || navigator.language.startsWith('pt') ? 'pt-BR' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enJSON,
    },
    "pt-BR": {
      translation: ptBRJSON,
    },
  },
  lng: storedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV === "development",
});

// Function to change language and store preference
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('language', lng);
};

export default i18n;
