import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../public/locales/en/common.json";
import ar from "../../public/locales/ar/common.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    ar: { common: ar },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
