import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { ordersApi } from "../../api/services";
import { ORDER_STATUSES, ORDER_STATUS_META, POLL_INTERVAL } from "../../utils/status";
import { formatDateTime, formatMoney, formatTime, relativeTime } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import OrderLines from "../../components/admin/OrderLines";
import { OrderStatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, Loading } from "../../components/ui/States";
import { IconReceipt, IconSearch } from "../../components/ui/Icons";
import "./Admin.css";

/** FR-21 — owner view of current and past orders, with FR-23 status timeline. */
export default function OrdersPage() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [scope, setScope] = useState("current");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(false);

  const { data, loading, error, reload } = useAsync(() => ordersApi.list({ scope }), [scope]);
  usePolling(() => reload({ silent: true }), POLL_INTERVAL.adminOrders, scope === "current");

  const orders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data || []).filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (!term) return true;
      return (
        String(order.number).includes(term) ||
        String(order.tableNumber ?? "").includes(term) ||
        (order.customerName || "").toLowerCase().includes(term)
      );
    });
  }, [data, statusFilter, search]);

  const counts = useMemo(() => {
    const list = data || [];
    return ORDER_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: list.filter((o) => o.status === status).length }),
      {}
    );
  }, [data]);

  const advanceStatus = async (order) => {
    const next = ORDER_STATUS_META[order.status]?.next;
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, next);
      toast.success(t("orders.statusUpdated"));
      setDetail(updated);
      reload({ silent: true });
    } catch (err) {
      toast.error(err?.message || t("common.unknownError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("orders.title")}</h1>
          <p className="page-subtitle">{t("orders.subtitle")}</p>
        </div>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${scope === "current" ? "active" : ""}`}
            onClick={() => setScope("current")}
          >
            {t("orders.current")}
          </button>
          <button
            type="button"
            className={`tab ${scope === "history" ? "active" : ""}`}
            onClick={() => setScope("history")}
          >
            {t("orders.history")}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="s-icon">
            <IconSearch size={17} />
          </span>
          <input
            className="input"
            placeholder={t("orders.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("common.search")}
          />
        </div>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={t("orders.filterStatus")}
        >
          <option value="">{t("orders.filterStatus")}</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`orders.status.${status}`)}
              {counts[status] ? ` (${counts[status]})` : ""}
            </option>
          ))}
        </select>

        <div className="grow" />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => reload()}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : null}
          {t("common.refresh")}
        </button>
      </div>

      <div className="card">
        {orders.length === 0 ? (
          <EmptyState icon={IconReceipt} title={t("orders.noOrders")} text={t("orders.noOrdersHint")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orders.orderNumber")}</th>
                  <th>{t("orders.table")}</th>
                  <th>{t("orders.customer")}</th>
                  <th>{t("common.items")}</th>
                  <th>{t("common.total")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("orders.placedAt")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-700 num">#{order.number}</td>
                    <td className="num">{order.tableNumber ?? "—"}</td>
                    <td className="truncate" style={{ maxWidth: 170 }}>
                      {order.customerName || "—"}
                    </td>
                    <td className="num">{order.items?.length ?? 0}</td>
                    <td className="fw-600 nowrap">{formatMoney(order.total, lang)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-sm text-muted nowrap" title={formatDateTime(order.createdAt, lang)}>
                      {scope === "current"
                        ? relativeTime(order.createdAt, t)
                        : formatDateTime(order.createdAt, lang)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDetail(order)}
                      >
                        {t("orders.viewDetails")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? t("orders.orderDetails", { number: detail.number }) : ""}
        footer={
          detail && ORDER_STATUS_META[detail.status]?.next ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>
                {t("common.close")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => advanceStatus(detail)}
                disabled={updating}
              >
                {updating && <span className="spinner" />}
                {t(`orders.status.${ORDER_STATUS_META[detail.status].next}`)}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>
              {t("common.close")}
            </button>
          )
        }
      >
        {detail && (
          <div className="stack gap-5">
            <div className="row between wrap gap-3">
              <div className="stack">
                <span className="text-xs text-muted">{t("orders.table")}</span>
                <strong className="num">{detail.tableNumber ?? "—"}</strong>
              </div>
              <div className="stack">
                <span className="text-xs text-muted">{t("orders.customer")}</span>
                <strong>{detail.customerName || "—"}</strong>
              </div>
              <div className="stack">
                <span className="text-xs text-muted">{t("common.phone")}</span>
                <strong className="num">{detail.customerPhone || "—"}</strong>
              </div>
              <OrderStatusBadge status={detail.status} size="lg" />
            </div>

            <div>
              <h3 className="card-title mb-3">{t("common.items")}</h3>
              <OrderLines items={detail.items} />
              <div className="bill-summary mt-4">
                <div className="b-total">
                  <span>{t("common.total")}</span>
                  <span className="num">{formatMoney(detail.total, lang)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="card-title mb-3">{t("orders.timeline")}</h3>
              <div className="timeline">
                {(detail.timeline || []).map((step, index) => (
                  <div className="timeline-step" key={`${step.status}-${index}`}>
                    <div className="t-marker">
                      <span
                        className="t-dot"
                        style={{ background: ORDER_STATUS_META[step.status]?.color }}
                      />
                      <span className="t-bar" />
                    </div>
                    <div className="t-content">
                      <div className="fw-600">{t(`orders.status.${step.status}`)}</div>
                      <div className="text-xs text-muted num">{formatTime(step.at, lang)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
