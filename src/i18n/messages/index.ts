import type { Locale, I18nMessages } from "../types";
import { enMessages } from "./en";
import { jaMessages } from "./ja";

export const messages: Record<Locale, I18nMessages> = {
  en: enMessages,
  ja: jaMessages,
  zh: enMessages, // Fallback to English for now
  ko: enMessages, // Fallback to English for now
  es: enMessages, // Fallback to English for now
  fr: enMessages, // Fallback to English for now
  de: enMessages, // Fallback to English for now
};

export { enMessages, jaMessages };
