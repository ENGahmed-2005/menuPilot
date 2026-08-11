import { createContext, useContext } from "react";
import ar from "./ar";
import en from "./en";

export const DICTS = { ar, en };
export const STORAGE_KEY = "menupilot.lang";

/** Resolves a dot-addressed key against a dictionary object. */
export function resolvePath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Replaces {{placeholders}} with the supplied values. */
export function interpolate(template, vars) {
  if (typeof template !== "string" || !vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

export const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
