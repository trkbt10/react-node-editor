/**
 * @file Internationalization provider and hooks for the node editor
 */
import * as React from "react";
import type { Locale, I18nKey, I18nContextValue, I18nMessages } from "./types";
import { messages } from "./messages";

const I18nContext = React.createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
  fallbackLocale?: Locale;
  /**
   * External message overrides or additions. You can provide partial maps per locale.
   * Example: { ja: { addNode: "ノード追加(外部)" } }
   */
  messagesOverride?: Partial<Record<Locale, Partial<I18nMessages>>>;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLocale = "en",
  fallbackLocale = "en",
  messagesOverride,
}) => {
  const [locale, setLocale] = React.useState<Locale>(initialLocale);
  const mergedMessages = React.useMemo(() => {
    // Merge base messages with overrides per locale
    if (!messagesOverride) {
      return messages;
    }
    const result: Record<Locale, I18nMessages> = { ...messages } as Record<Locale, I18nMessages>;
    (Object.keys(messagesOverride) as Locale[]).forEach((loc) => {
      result[loc] = {
        ...(messages[loc] || messages[fallbackLocale]),
        ...(messagesOverride?.[loc] as Partial<I18nMessages>),
      } as I18nMessages;
    });
    return result;
  }, [messagesOverride, fallbackLocale]);

  React.useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  // Detect browser locale on mount
  React.useEffect(() => {
    if (typeof window !== "undefined" && !initialLocale) {
      const browserLocale = navigator.language.split("-")[0] as Locale;
      if (Object.keys(messages).includes(browserLocale)) {
        setLocale(browserLocale);
      }
    }
  }, [initialLocale]);

  const t = React.useCallback(
    (key: I18nKey, params?: Record<string, string | number>): string => {
      const currentMessages = mergedMessages[locale] || mergedMessages[fallbackLocale];
      let message = currentMessages[key] || mergedMessages[fallbackLocale][key] || key;

      // Simple parameter interpolation
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          message = message.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
        });
      }

      return message;
    },
    [locale, fallbackLocale, mergedMessages],
  );

  const availableLocales = React.useMemo(() => {
    return Object.keys(mergedMessages) as Locale[];
  }, [mergedMessages]);

  const contextValue: I18nContextValue = React.useMemo(
    () => ({
      locale,
      setLocale,
      t,
      availableLocales,
    }),
    [locale, t, availableLocales],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

// Hook for getting translated messages with fallback
export const useTranslation = () => {
  const { t, locale, setLocale } = useI18n();

  return {
    t,
    locale,
    setLocale,
    // Additional helper functions
    formatNumber: (num: number): string => {
      return new Intl.NumberFormat(locale).format(num);
    },
    formatDate: (date: Date): string => {
      return new Intl.DateTimeFormat(locale).format(date);
    },
    formatDateTime: (date: Date): string => {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
  };
};
