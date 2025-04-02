import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enJSON from "./locales/en.json" assert { type: "json" };
import ptBRJSON from "./locales/pt-BR.json" assert { type: "json" };

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enJSON,
    },
    "pt-BR": {
      translation: ptBRJSON,
    },
  },
  lng: "pt-BR",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV === "development",
});

export default i18n;
