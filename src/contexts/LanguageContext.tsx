import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, Language, TranslationKeys } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "preferred-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      return stored;
    }
    // Default to browser language or English
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "de" ? "de" : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = translations[language];

  const locale = language === "de" ? "de-DE" : "en-US";

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(num);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, options || { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }).format(dateObj);
    },
    [locale]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNumber,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Helper function to interpolate variables in translation strings
export function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/{(\w+)}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
