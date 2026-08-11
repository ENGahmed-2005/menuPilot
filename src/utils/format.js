/** Formats a money amount with the active locale and currency symbol. */
export function formatMoney(amount, lang = "ar", currency) {
  const value = Number(amount || 0);
  const symbol = currency || (lang === "ar" ? "ر.س" : "SAR");
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
    numberingSystem: "latn",
  }).format(value);
  return lang === "ar" ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
}

/** Short clock time, e.g. 14:35. */
export function formatTime(iso, lang = "ar") {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    numberingSystem: "latn",
  });
}

/** Date + time, e.g. 2026-08-10 14:35. */
export function formatDateTime(iso, lang = "ar") {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    numberingSystem: "latn",
  });
  return `${date} ${formatTime(iso, lang)}`;
}

/** Elapsed duration as mm:ss / h:mm. */
export function elapsedSince(iso) {
  if (!iso) return "0:00";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Whole minutes elapsed since a timestamp. */
export function minutesSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

/** Human relative time using the i18n `t` function. */
export function relativeTime(iso, t) {
  if (!iso) return "—";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return t("common.justNow");
  if (seconds < 3600) return t("common.minutesAgo", { count: Math.max(1, Math.round(seconds / 60)) });
  return t("common.hoursAgo", { count: Math.round(seconds / 3600) });
}

/** Session duration label, e.g. "1:24". */
export function durationBetween(startIso, endIso) {
  if (!startIso) return "—";
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - new Date(startIso).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}`;
}

/** Picks the localized field (name/nameEn) with a graceful fallback. */
export function localized(record, field, lang) {
  if (!record) return "";
  if (lang === "en") {
    const enKey = `${field}En`;
    return record[enKey]?.trim() ? record[enKey] : record[field] || "";
  }
  return record[field]?.trim() ? record[field] : record[`${field}En`] || "";
}
