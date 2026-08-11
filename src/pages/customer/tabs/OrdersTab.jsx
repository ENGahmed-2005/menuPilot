import { useI18n } from "../../../i18n/I18nContext";
import { ORDER_STATUSES } from "../../../utils/status";
import { formatMoney, localized, relativeTime } from "../../../utils/format";
import { EmptyState, Loading } from "../../../components/ui/States";
import {
  IconCheck,
  IconCheckCircle,
  IconChef,
  IconClock,
  IconNote,
  IconReceipt,
} from "../../../components/ui/Icons";

const STEP_ICONS = {
  pending: IconClock,
  preparing: IconChef,
  ready: IconCheckCircle,
  served: IconCheck,
};

/**
 * FR-20 — live order tracking for the customer.
 * The parent polls the API, so the steps advance without a manual refresh.
 */
export default function OrdersTab({ orders, loading, onBrowse }) {
  const { t, lang } = useI18n();

  if (loading && orders.length === 0) return <Loading />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={IconReceipt}
        title={t("customer.orders.empty")}
        text={t("customer.orders.emptyHint")}
        action={
          <button type="button" className="btn btn-primary" onClick={onBrowse}>
            {t("customer.cart.browseMenu")}
          </button>
        }
      />
    );
  }

  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="stack gap-4">
      {readyOrders.map((order) => (
        <div className="ready-banner" key={`ready-${order.id}`} role="status">
          <IconCheckCircle size={22} />
          <span>{t("customer.orders.readyBanner", { number: order.number })}</span>
        </div>
      ))}

      <div className="row between">
        <h2 className="card-title">{t("customer.orders.title")}</h2>
        <span className="badge badge-brand">
          <span className="dot" />
          {t("customer.orders.liveTracking")}
        </span>
      </div>

      {orders.map((order) => {
        const currentIndex = ORDER_STATUSES.indexOf(order.status);
        return (
          <article
            key={order.id}
            className={`order-track-card ${order.status === "ready" ? "is-ready" : ""}`}
          >
            <div className="row between gap-2 wrap">
              <strong className="num">
                {t("customer.orders.orderNumber", { number: order.number })}
              </strong>
              <span className="text-xs text-muted">
                {t("customer.orders.placedAt", { time: relativeTime(order.createdAt, t) })}
              </span>
            </div>

            {order.status === "cancelled" ? (
              <div className="alert alert-error">{t("orders.status.cancelled")}</div>
            ) : (
              <div className="track-steps">
                {ORDER_STATUSES.map((status, index) => {
                  const Icon = STEP_ICONS[status];
                  const state =
                    index < currentIndex ? "done" : index === currentIndex ? "current" : "";
                  return (
                    <div className={`track-step ${state}`} key={status}>
                      <span className="ts-dot">
                        {index < currentIndex ? <IconCheck size={16} /> : <Icon size={16} />}
                      </span>
                      <span className="ts-label">{t(`customer.orders.steps.${status}`)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="stack gap-2">
              {order.items.map((line, index) => (
                <div className="bill-item-row" key={`${line.itemId}-${index}`}>
                  <span className="bi-qty num">{line.quantity}×</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div>{localized(line, "name", lang)}</div>
                    {line.note && (
                      <span className="cl-note mt-1">
                        <IconNote size={12} />
                        <span>{line.note}</span>
                      </span>
                    )}
                  </div>
                  <span className="fw-600 num nowrap">
                    {formatMoney(line.price * line.quantity, lang)}
                  </span>
                </div>
              ))}
            </div>

            <div className="row between fw-700" style={{ borderBlockStart: "1px solid var(--border)", paddingBlockStart: 10 }}>
              <span>{t("common.total")}</span>
              <span className="num">{formatMoney(order.total, lang)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
