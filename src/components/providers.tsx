'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { messages } from '@/i18n/messages';
import type { Locale, Text } from '@/types/diagnostic';
interface AppContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tx: (text: Text) => string;
  pendingDescription: string;
  setPendingDescription: (text: string) => void;
}
const Context = createContext<AppContext | null>(null);
export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [pendingDescription, setPendingDescription] = useState('');
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <Context.Provider
      value={{
        locale,
        setLocale,
        tx: (text) => text[locale],
        pendingDescription,
        setPendingDescription,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('Provider missing');
  return { ...value, m: messages };
}
