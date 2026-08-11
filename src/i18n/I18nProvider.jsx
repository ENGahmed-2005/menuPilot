import { useCallback, useEffect, useMemo, useState } from "react";
import { DICTS, I18nContext, STORAGE_KEY, interpolate, resolvePath } from "./I18nContext";

/**
 * Provides the active language, the `t()` translator, and keeps
 * <html lang/dir> in sync so the whole UI mirrors for Arabic.
 */
export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "ar";
    } catch {
      return "ar";
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = DICTS[lang].meta.dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      const found = resolvePath(DICTS[lang], key);
      if (found !== undefined) return interpolate(found, vars);

      // Fall back to English, then to the key itself.
      const fallback = resolvePath(DICTS.en, key);
      return interpolate(fallback === undefined ? key : fallback, vars);
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, dir: DICTS[lang].meta.dir }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export default I18nProvider;
