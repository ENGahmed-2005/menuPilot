import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { IconAlert } from "../components/ui/Icons";

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 32,
        textAlign: "center",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 22,
          background: "var(--gray-100)",
          color: "var(--gray-500)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconAlert size={34} />
      </div>
      <h1 style={{ fontSize: 22 }}>{t("errors.notFoundTitle")}</h1>
      <p className="text-muted" style={{ maxWidth: "40ch" }}>
        {t("errors.notFoundText")}
      </p>
      <Link to="/" className="btn btn-primary mt-2">
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
