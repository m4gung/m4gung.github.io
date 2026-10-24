import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idMessages } from './locales/id';
import { enMessages } from './locales/en';
import type { TranslationMessages, Locale } from './types';
import { defaultLocale, supportedLocales } from './types';

const messages: Record<Locale, TranslationMessages> = {
  id: idMessages,
  en: enMessages,
};

interface I18nState {
  locale: Locale;
  messages: TranslationMessages;
  isReady: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getAvailableLocales: () => Locale[];
  getLocaleName: (locale: Locale) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'id' as Locale,
      messages: idMessages,
      isReady: true,

      setLocale: (locale: Locale) => {
        const newMessages = messages[locale] || messages[defaultLocale];
        set({ locale, messages: newMessages });
        document.documentElement.lang = locale;
      },

      t: (key: string, params?: Record<string, string | number>) => {
        const { messages } = get();
        const keys = key.split('.');
        let value: any = messages;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        if (typeof value !== 'string') return key;
        if (params) {
          return value.replace(/\{(\w+)\}/g, (match, key) => String(params[key] ?? match));
        }
        return value;
      },

      getAvailableLocales: () => supportedLocales,

      getLocaleName: (locale: Locale) => {
        const names: Record<Locale, string> = {
          id: 'Bahasa Indonesia',
          en: 'English',
        };
        return names[locale] || locale;
      },
    }),
    {
      name: 'i18n-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.messages = messages[state.locale] || messages.id;
          state.isReady = true;
        }
      },
    }
  )
);

export function useTranslation() {
  const { t, locale, setLocale, messages, isReady, getAvailableLocales, getLocaleName } = useI18n();
  return { t, locale, setLocale, messages, isReady, getAvailableLocales, getLocaleName };
}

export function useLocale() {
  const { locale, setLocale, getAvailableLocales, getLocaleName } = useI18n();
  return { locale, setLocale, getAvailableLocales, getLocaleName };
}