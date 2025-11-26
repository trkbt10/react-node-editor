/**
 * @file Internationalization provider and hooks for the node editor
 */
import * as React from "react";
import type { Locale, I18nContextValue, I18nMessages, I18nKey, I18nDictionaries } from "./types";

const I18nContext = React.createContext<I18nContextValue | null>(null);
I18nContext.displayName = "I18nContext";

type I18nProviderProps = {
  children: React.ReactNode;
  dictionaries: I18nDictionaries;
  initialLocale?: Locale;
  fallbackLocale?: Locale;
  /**
   * External message overrides or additions. You can provide partial maps per locale.
   * Example: { ja: { addNode: "ノード追加(外部)" } }
   */
  messagesOverride?: Partial<Record<Locale, Partial<I18nMessages>>>;
};

const DEFAULT_FALLBACK_LOCALE: Locale = "en";

const mergeDictionaries = (
  dictionaries: I18nDictionaries,
  fallbackLocale: Locale,
  messagesOverride?: Partial<Record<Locale, Partial<I18nMessages>>>,
): Record<Locale, I18nMessages> => {
  const merged: Record<Locale, I18nMessages> = {} as Record<Locale, I18nMessages>;

  (Object.entries(dictionaries) as Array<[Locale, I18nMessages]>).forEach(([locale, dictionary]) => {
    if (!dictionary) {
      return;
    }
    merged[locale] = { ...dictionary };
  });

  const fallbackDictionary =
    merged[fallbackLocale] ?? merged[DEFAULT_FALLBACK_LOCALE] ?? Object.values(merged)[0] ?? undefined;

  if (messagesOverride && fallbackDictionary) {
    (Object.entries(messagesOverride) as Array<[Locale, Partial<I18nMessages>]>).forEach(
      ([locale, overrideMessages]) => {
        if (!overrideMessages) {
          return;
        }
        const source = merged[locale] ?? fallbackDictionary;
        merged[locale] = {
          ...source,
          ...overrideMessages,
        } as I18nMessages;
      },
    );
  }

  return merged;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  dictionaries,
  initialLocale,
  fallbackLocale = DEFAULT_FALLBACK_LOCALE,
  messagesOverride,
}) => {
  const mergedDictionaries = React.useMemo(
    () => mergeDictionaries(dictionaries, fallbackLocale, messagesOverride),
    [dictionaries, fallbackLocale, messagesOverride],
  );

  const availableLocales = React.useMemo(() => {
    return Object.keys(mergedDictionaries) as Locale[];
  }, [mergedDictionaries]);

  const resolvedFallbackLocale: Locale | undefined = React.useMemo(() => {
    if (mergedDictionaries[fallbackLocale]) {
      return fallbackLocale;
    }
    if (mergedDictionaries[DEFAULT_FALLBACK_LOCALE]) {
      return DEFAULT_FALLBACK_LOCALE;
    }
    return availableLocales[0];
  }, [availableLocales, fallbackLocale, mergedDictionaries]);

  if (!resolvedFallbackLocale) {
    throw new Error("I18nProvider requires at least one dictionary. Provide at least an English dictionary.");
  }

  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (initialLocale && mergedDictionaries[initialLocale]) {
      return initialLocale;
    }
    return resolvedFallbackLocale;
  });

  React.useEffect(() => {
    if (initialLocale && mergedDictionaries[initialLocale]) {
      setLocaleState(initialLocale);
      return;
    }
    if (!mergedDictionaries[locale]) {
      setLocaleState(resolvedFallbackLocale);
    }
  }, [initialLocale, locale, mergedDictionaries, resolvedFallbackLocale]);

  const setLocale = React.useCallback(
    (nextLocale: Locale) => {
      if (mergedDictionaries[nextLocale]) {
        setLocaleState(nextLocale);
        return;
      }
      setLocaleState(resolvedFallbackLocale);
    },
    [mergedDictionaries, resolvedFallbackLocale],
  );

  const translate = React.useCallback(
    (key: I18nKey, params?: Record<string, string | number>): string => {
      const activeDictionary = mergedDictionaries[locale] ?? mergedDictionaries[resolvedFallbackLocale];
      const fallbackDictionary = mergedDictionaries[resolvedFallbackLocale];
      let message = activeDictionary?.[key] ?? fallbackDictionary?.[key] ?? key;

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          message = message.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
        });
      }

      return message;
    },
    [locale, mergedDictionaries, resolvedFallbackLocale],
  );

  const contextValue: I18nContextValue = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: translate,
      availableLocales,
    }),
    [availableLocales, locale, setLocale, translate],
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

  return React.useMemo(
    () => ({
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
    }),
    [t, locale, setLocale],
  );
};
