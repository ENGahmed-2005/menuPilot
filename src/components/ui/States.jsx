import { useI18n } from "../../i18n/I18nContext";
import { IconAlert, IconInbox } from "./Icons";

/** Centered spinner block for initial page loads. */
export function Loading({ label }) {
  const { t } = useI18n();
  return (
    <div className="loading-block">
      <span className="spinner spinner-lg text-brand" />
      <span className="text-sm">{label || t("common.loading")}</span>
    </div>
  );
}

/** Empty-state placeholder with optional action. */
export function EmptyState({ icon, title, text, action }) {
  const Icon = icon || IconInbox;
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={30} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Normalized error block with retry.
 * Understands the error shape produced by the axios interceptor.
 */
export function ErrorState({ error, onRetry }) {
  const { t } = useI18n();
  const message = error?.isNetwork
    ? t("common.networkError")
    : error?.message || t("common.unknownError");

  return (
    <div className="empty-state">
      <div className="empty-icon" style={{ background: "var(--danger-50)", color: "var(--danger-600)" }}>
        <IconAlert size={30} />
      </div>
      <h3>{t("common.unknownError")}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-4" onClick={() => onRetry()}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

/** Simple shimmer rows used while tables/lists load. */
export function SkeletonRows({ rows = 4, height = 56 }) {
  return (
    <div className="stack gap-2" style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
