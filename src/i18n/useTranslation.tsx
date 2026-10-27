import React, { createContext, useContext, useState, useEffect } from 'react';
import idDict from './id.json';
import enDict from './en.json';
import { Language, CurrencyCode } from '../types';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: typeof idDict;
  formatMoney: (amountIDR: number) => string;
  exchangeRateInfo: { rate: number; symbol: string; updatedLabel: string };
}

const RATES: Record<CurrencyCode, { rate: number; symbol: string; locale: string }> = {
  IDR: { rate: 1, symbol: 'Rp', locale: 'id-ID' },
  USD: { rate: 15850, symbol: 'US$', locale: 'en-US' },
  AUD: { rate: 10300, symbol: 'A$', locale: 'en-AU' },
  EUR: { rate: 17100, symbol: '€', locale: 'de-DE' },
  SGD: { rate: 11800, symbol: 'S$', locale: 'en-SG' },
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('jb_lang');
    return saved === 'en' ? 'en' : 'id';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('jb_currency') as CurrencyCode;
    return saved && RATES[saved] ? saved : 'IDR';
  });

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem('jb_dark') === 'true';
  });

  const setLang = (next: Language) => {
    setLangState(next);
    localStorage.setItem('jb_lang', next);
    document.documentElement.lang = next;
  };

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
    localStorage.setItem('jb_currency', next);
  };

  const setDarkMode = (next: boolean) => {
    setDarkModeState(next);
    localStorage.setItem('jb_dark', String(next));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const formatMoney = (amountIDR: number): string => {
    const cfg = RATES[currency] || RATES.IDR;
    if (currency === 'IDR') {
      return `Rp${Math.round(amountIDR).toLocaleString('id-ID')}`;
    }
    const converted = amountIDR / cfg.rate;
    return `${cfg.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const t = lang === 'en' ? enDict : idDict;

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        currency,
        setCurrency,
        darkMode,
        setDarkMode,
        t,
        formatMoney,
        exchangeRateInfo: {
          rate: RATES[currency].rate,
          symbol: RATES[currency].symbol,
          updatedLabel:
            currency === 'IDR'
              ? 'IDR (Mata Uang Utama)'
              : `1 ${currency} ≈ Rp${RATES[currency].rate.toLocaleString('id-ID')} (Kurs Referensi Bank Indonesia)`,
        },
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside I18nProvider');
  return ctx;
}
