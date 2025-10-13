/**
 * @file Main export point for internationalization module
 */
export { I18nProvider, useI18n, useTranslation } from "./context";
export type { Locale, I18nKey, I18nMessages, I18nConfig, I18nContextValue, I18nDictionaries } from "./types";
export { enMessages } from "./dictionaries/en";
