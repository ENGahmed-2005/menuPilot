import { useI18n } from "../../i18n/I18nContext";
import { IconGlobe } from "./Icons";

/** Toggles between Arabic (RTL) and English (LTR). */
export default function LanguageToggle({ compact = false, className = "" }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      className={`btn btn-ghost ${compact ? "btn-icon" : "btn-sm"} ${className}`}
      onClick={() => setLang(next)}
      title={t("common.language")}
      aria-label={`${t("common.language")}: ${next === "ar" ? "العربية" : "English"}`}
    >
      <IconGlobe size={compact ? 18 : 16} />
      {!compact && <span>{next === "ar" ? "العربية" : "English"}</span>}
    </button>
  );
}
