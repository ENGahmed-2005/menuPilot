import { useI18n } from "../../i18n/I18nContext";
import {
  ORDER_STATUS_META,
  SESSION_STATUS_META,
  TABLE_STATUS_META,
} from "../../utils/status";

/** Order status pill (pending / preparing / ready / served / cancelled). */
export function OrderStatusBadge({ status, size }) {
  const { t } = useI18n();
  const meta = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
  return (
    <span className={`badge ${meta.badge} ${size === "lg" ? "badge-lg" : ""}`}>
      <span className="dot" />
      {t(`orders.status.${status}`)}
    </span>
  );
}

/** Dining-session status pill (opened → ... → closed). */
export function SessionStatusBadge({ status, size }) {
  const { t } = useI18n();
  const meta = SESSION_STATUS_META[status] || SESSION_STATUS_META.opened;
  return (
    <span className={`badge ${meta.badge} ${size === "lg" ? "badge-lg" : ""}`}>
      <span className="dot" />
      {t(`sessions.status.${status}`)}
    </span>
  );
}

/** Table availability pill. */
export function TableStatusBadge({ status, size }) {
  const { t } = useI18n();
  const meta = TABLE_STATUS_META[status] || TABLE_STATUS_META.available;
  return (
    <span className={`badge ${meta.badge} ${size === "lg" ? "badge-lg" : ""}`}>
      <span className="dot" />
      {t(`tables.status.${status}`)}
    </span>
  );
}
