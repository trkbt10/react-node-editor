/**
 * @file Example demonstrating runtime i18n configuration for the Node Editor
 */
import * as React from "react";

import { NodeEditor } from "../../../../../NodeEditor";
import { enMessages } from "../../../../../i18n/en";
import type { I18nDictionaries, I18nMessages, Locale } from "../../../../../i18n/types";
import type { NodeEditorData } from "../../../../../types/core";
import { StandardNodeDefinition } from "../../../../../node-definitions/standard";
import { toUntypedDefinition } from "../../../../../types/NodeDefinition";
import classes from "./I18nPlaygroundExample.module.css";

const playgroundInitialData: NodeEditorData = {
  nodes: {
    "welcome-node": {
      id: "welcome-node",
      type: "standard",
      position: { x: 160, y: 140 },
      size: { width: 240, height: 160 },
      data: {
        title: "Locale Playground",
        content: "Switch locales and overrides to preview translation changes live.",
      },
    },
    "workflow-node": {
      id: "workflow-node",
      type: "standard",
      position: { x: 520, y: 240 },
      size: { width: 240, height: 160 },
      data: {
        title: "Workflow Step",
        content: "Customize labels like “Add Node” or the inspector title.",
      },
    },
  },
  connections: {
    "welcome-to-workflow": {
      id: "welcome-to-workflow",
      fromNodeId: "welcome-node",
      fromPortId: "output",
      toNodeId: "workflow-node",
      toPortId: "input",
    },
  },
};

type I18nOverrideKey =
  | "addNode"
  | "inspectorTitle"
  | "statusSelection"
  | "inspectorTabProperties"
  | "alignmentTitle"
  | "alignmentSelectPrompt"
  | "alignmentCountLabel";

const overrideLabels: Record<I18nOverrideKey, string> = {
  addNode: "Add node action label",
  inspectorTitle: "Inspector panel title",
  statusSelection: "Status bar selection label",
  inspectorTabProperties: "Inspector properties tab label",
  alignmentTitle: "Alignment section title",
  alignmentSelectPrompt: "Alignment prompt when disabled",
  alignmentCountLabel: "Alignment count label",
};

const overrideKeys: readonly I18nOverrideKey[] = [
  "addNode",
  "inspectorTitle",
  "statusSelection",
  "inspectorTabProperties",
  "alignmentTitle",
  "alignmentSelectPrompt",
  "alignmentCountLabel",
] as const;

const SUPPORTED_LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文 (繁體)" },
  { value: "zh-CN", label: "中文 (简体)" },
  { value: "ko", label: "한국어" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
] as const satisfies ReadonlyArray<{ value: Locale; label: string }>;

const LOCALE_DICTIONARY_CODES = ["ja", "zh", "zh-CN", "ko", "es", "fr", "de"] as const;
type LocaleWithDictionary = (typeof LOCALE_DICTIONARY_CODES)[number];

type LocaleDictionaryLoader = () => Promise<I18nMessages>;

const LOCALE_DICTIONARY_LOADERS: Record<LocaleWithDictionary, LocaleDictionaryLoader> = {
  ja: async () => (await import("../../i18n/ja")).jaMessages,
  zh: async () => (await import("../../i18n/zh")).zhMessages,
  "zh-CN": async () => (await import("../../i18n/zh-cn")).zhCNMessages,
  ko: async () => (await import("../../i18n/ko")).koMessages,
  es: async () => (await import("../../i18n/es")).esMessages,
  fr: async () => (await import("../../i18n/fr")).frMessages,
  de: async () => (await import("../../i18n/de")).deMessages,
} as const;

const hasDictionaryLoader = (locale: Locale): locale is LocaleWithDictionary => {
  return (LOCALE_DICTIONARY_CODES as readonly string[]).includes(locale as LocaleWithDictionary);
};

/**
 * Renders the internationalization playground example with runtime configuration controls.
 */
export function I18nPlaygroundExample(): React.ReactElement {
  const supportedLocaleOptions = React.useMemo(() => SUPPORTED_LOCALE_OPTIONS.slice(), []);

  const [dictionaries, setDictionaries] = React.useState<I18nDictionaries>({ en: enMessages });
  const [locale, setLocale] = React.useState<Locale>("en");
  const [fallbackLocale, setFallbackLocale] = React.useState<Locale>("en");
  const [overrideLocale, setOverrideLocale] = React.useState<Locale>("ja");
  const [messageOverrides, setMessageOverrides] = React.useState<Partial<Record<Locale, Partial<I18nMessages>>>>({});

  React.useEffect(() => {
    const localesToEnsure = Array.from(new Set([locale, fallbackLocale, overrideLocale].filter(Boolean) as Locale[]));
    let cancelled = false;

    const ensureLocaleDictionary = async (targetLocale: Locale) => {
      if (targetLocale === "en") {
        return;
      }
      if (dictionaries[targetLocale]) {
        return;
      }
      if (!hasDictionaryLoader(targetLocale)) {
        return;
      }
      const loadDictionary = LOCALE_DICTIONARY_LOADERS[targetLocale];
      const messages = await loadDictionary();
      if (cancelled) {
        return;
      }
      setDictionaries((prev) => {
        if (prev[targetLocale]) {
          return prev;
        }
        return {
          ...prev,
          [targetLocale]: messages,
        };
      });
    };

    localesToEnsure.forEach((targetLocale) => {
      void ensureLocaleDictionary(targetLocale);
    });

    return () => {
      cancelled = true;
    };
  }, [dictionaries, fallbackLocale, locale, overrideLocale]);

  const resolveDictionary = React.useCallback(
    (targetLocale: Locale): I18nMessages => {
      const fallbackMessages = (dictionaries[fallbackLocale] ?? dictionaries.en ?? enMessages) as I18nMessages;
      const baseMessages = (dictionaries[targetLocale] ?? fallbackMessages) as I18nMessages;
      const overrides = messageOverrides[targetLocale];
      if (!overrides) {
        return baseMessages;
      }
      return {
        ...baseMessages,
        ...overrides,
      } as I18nMessages;
    },
    [dictionaries, fallbackLocale, messageOverrides],
  );

  const overridePreviewMessages = React.useMemo(
    () => resolveDictionary(overrideLocale),
    [overrideLocale, resolveDictionary],
  );

  const editorDictionaries = React.useMemo<I18nDictionaries>(() => {
    const result: I18nDictionaries = {};
    (Object.entries(dictionaries) as Array<[Locale, I18nMessages]>).forEach(([key, value]) => {
      if (key === "en") {
        return;
      }
      result[key] = value;
    });
    return result;
  }, [dictionaries]);

  const handleOverrideChange = React.useCallback(
    (key: I18nOverrideKey, value: string) => {
      setMessageOverrides((prev) => {
        const overridesForLocale = {
          ...(prev[overrideLocale] ?? {}),
        } as Partial<I18nMessages>;

        if (value.trim() === "") {
          delete overridesForLocale[key];
        } else {
          overridesForLocale[key] = value;
        }

        const nextOverrides = {
          ...prev,
        } as Partial<Record<Locale, Partial<I18nMessages>>>;

        if (Object.keys(overridesForLocale).length === 0) {
          delete nextOverrides[overrideLocale];
          return nextOverrides;
        }

        return {
          ...nextOverrides,
          [overrideLocale]: overridesForLocale,
        };
      });
    },
    [overrideLocale],
  );

  return (
    <div className={classes.layout}>
      <aside className={classes.controls}>
        <div className={classes.controlsHeader}>
          <h2 className={classes.controlsTitle}>Internationalization Playground</h2>
          <p className={classes.controlsDescription}>
            Adjust locale, fallback, and specific message overrides to validate translation behavior inside the editor
            UI.
          </p>
        </div>

        <section className={classes.controlGroup}>
          <h3 className={classes.controlGroupTitle}>Locale Settings</h3>
          <div className={classes.field}>
            <label className={classes.label} htmlFor="i18n-locale">
              Active locale
            </label>
            <select
              id="i18n-locale"
              className={classes.select}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {supportedLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={classes.field}>
            <label className={classes.label} htmlFor="i18n-fallback-locale">
              Fallback locale
            </label>
            <select
              id="i18n-fallback-locale"
              className={classes.select}
              value={fallbackLocale}
              onChange={(event) => setFallbackLocale(event.target.value as Locale)}
            >
              {supportedLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={classes.controlGroup}>
          <h3 className={classes.controlGroupTitle}>Message Overrides</h3>
          <p className={classes.hint}>
            Choose a locale to override and customise specific labels. Leave a field empty to revert to the default
            translation.
          </p>

          <div className={classes.field}>
            <label className={classes.label} htmlFor="override-locale">
              Locale to override
            </label>
            <select
              id="override-locale"
              className={classes.select}
              value={overrideLocale}
              onChange={(event) => setOverrideLocale(event.target.value as Locale)}
            >
              {supportedLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {overrideKeys.map((overrideKey) => {
            const previewValue =
              overrideKey === "alignmentCountLabel"
                ? (overridePreviewMessages.alignmentCountLabel ?? "").replace(/{{count}}/g, "3")
                : (overridePreviewMessages[overrideKey] ?? "");
            return (
              <div className={classes.field} key={overrideKey}>
                <div className={classes.labelRow}>
                  <label className={classes.label} htmlFor={`override-${overrideKey}`}>
                    {overrideLabels[overrideKey]}
                  </label>
                  <span className={classes.previewValue}>{previewValue}</span>
                </div>
                <input
                  id={`override-${overrideKey}`}
                  className={classes.input}
                  type="text"
                  value={messageOverrides[overrideLocale]?.[overrideKey] ?? ""}
                  onChange={(event) => handleOverrideChange(overrideKey, event.target.value)}
                  placeholder={`Custom ${overrideKey} message`}
                />
              </div>
            );
          })}
        </section>
      </aside>

      <div className={classes.editorSurface}>
        <NodeEditor
          initialData={playgroundInitialData}
          locale={locale}
          fallbackLocale={fallbackLocale}
          messagesOverride={messageOverrides}
          localeDictionaries={editorDictionaries}
          nodeDefinitions={[toUntypedDefinition(StandardNodeDefinition)]}
        />
      </div>
    </div>
  );
}
