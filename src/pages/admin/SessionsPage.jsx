import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { sessionsApi, tablesApi } from "../../api/services";
import { POLL_INTERVAL } from "../../utils/status";
import {
  durationBetween,
  formatDateTime,
  formatMoney,
  formatTime,
  relativeTime,
} from "../../utils/format";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import OrderLines from "../../components/admin/OrderLines";
import { OrderStatusBadge, SessionStatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, Loading } from "../../components/ui/States";
import {
  IconCard,
  IconCash,
  IconClock,
  IconPlus,
  IconReceipt,
  IconUsers,
} from "../../components/ui/Icons";
import "./Admin.css";

/**
 * Cashier / waiter workspace.
 * FR-28 (bill alerts), FR-29 (session total), FR-30 (payment method),
 * FR-31 (close only after payment), FR-32 (table released).
 */
export default function SessionsPage() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [scope, setScope] = useState("active");
  const [detailId, setDetailId] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [closing, setClosing] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const { data, loading, error, reload } = useAsync(() => sessionsApi.list({ scope }), [scope]);
  usePolling(() => reload({ silent: true }), POLL_INTERVAL.sessions, scope === "active");

  const detail = useAsync(
    () => (detailId ? sessionsApi.get(detailId) : Promise.resolve(null)),
    [detailId],
    { immediate: Boolean(detailId) }
  );

  const sessions = useMemo(() => data || [], [data]);
  const billRequests = useMemo(
    () => sessions.filter((s) => ["bill_requested", "payment_pending"].includes(s.status)),
    [sessions]
  );

  const refreshAll = () => {
    reload({ silent: true });
    if (detailId) detail.reload({ silent: true });
  };

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("sessions.title")}</h1>
          <p className="page-subtitle">{t("sessions.subtitle")}</p>
        </div>
        <div className="row gap-3 wrap">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${scope === "active" ? "active" : ""}`}
              onClick={() => setScope("active")}
            >
              {t("sessions.active")}
              {scope === "active" && sessions.length > 0 && (
                <span className="count num">{sessions.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`tab ${scope === "closed" ? "active" : ""}`}
              onClick={() => setScope("closed")}
            >
              {t("sessions.closed")}
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setOpenModal(true)}>
            <IconPlus size={17} />
            {t("sessions.openSession")}
          </button>
        </div>
      </div>

      {billRequests.length > 0 && scope === "active" && (
        <div className="alert alert-warning mb-4" role="status">
          <IconReceipt size={18} />
          <span>
            {billRequests
              .map((s) => t("sessions.billRequestAlert", { number: s.table?.number ?? "—" }))
              .join(" · ")}
          </span>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconUsers}
            title={t("sessions.noSessions")}
            text={t("sessions.noSessionsHint")}
          />
        </div>
      ) : (
        <div className="session-grid">
          {sessions.map((session) => {
            const needsBill = ["bill_requested", "payment_pending"].includes(session.status);
            return (
              <article
                key={session.id}
                className={`session-card ${needsBill ? "needs-bill" : ""}`}
              >
                <div className="row between gap-3">
                  <div className="row gap-3">
                    <span className="table-number num">{session.table?.number ?? "—"}</span>
                    <div className="stack" style={{ minWidth: 0 }}>
                      <strong className="truncate">{session.customerName || "—"}</strong>
                      <span className="text-xs text-muted num" dir="ltr">
                        {session.customerPhone || "—"}
                      </span>
                    </div>
                  </div>
                  <SessionStatusBadge status={session.status} />
                </div>

                <div className="session-meta">
                  <div className="stack">
                    <span className="m-label">{t("sessions.openedAt")}</span>
                    <span className="m-value num">{formatTime(session.openedAt, lang)}</span>
                  </div>
                  <div className="stack">
                    <span className="m-label">{t("sessions.duration")}</span>
                    <span className="m-value num">
                      {durationBetween(session.openedAt, session.closedAt)} {t("dashboard.minutes")}
                    </span>
                  </div>
                  <div className="stack">
                    <span className="m-label">{t("orders.title")}</span>
                    <span className="m-value num">{session.ordersCount ?? 0}</span>
                  </div>
                  <div className="stack">
                    <span className="m-label">{t("sessions.totalAmount")}</span>
                    <span className="m-value num">{formatMoney(session.bill?.total ?? 0, lang)}</span>
                  </div>
                </div>

                {session.billRequestedAt && session.status !== "closed" && (
                  <div className="table-session">
                    <IconClock size={14} />{" "}
                    {t("sessions.billRequestedAt", {
                      time: relativeTime(session.billRequestedAt, t),
                    })}
                  </div>
                )}

                <div className="row gap-2" style={{ marginBlockStart: "auto" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm grow"
                    onClick={() => setDetailId(session.id)}
                  >
                    {t("sessions.viewSession")}
                  </button>

                  {session.status !== "closed" && !session.payment && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPaymentFor(session)}
                    >
                      <IconCash size={15} />
                      {t("sessions.recordPayment")}
                    </button>
                  )}

                  {session.status !== "closed" && session.payment && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => setClosing(session)}
                    >
                      {t("sessions.closeSession")}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SessionDetailModal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        request={detail}
        onPay={(session) => {
          setDetailId(null);
          setPaymentFor(session);
        }}
        onClose_={(session) => {
          setDetailId(null);
          setClosing(session);
        }}
      />

      <PaymentModal
        session={paymentFor}
        onClose={() => setPaymentFor(null)}
        onDone={() => {
          toast.success(t("sessions.paymentRecorded"));
          refreshAll();
        }}
      />

      <ConfirmDialog
        open={Boolean(closing)}
        onClose={() => setClosing(null)}
        onConfirm={async () => {
          try {
            await sessionsApi.close(closing.id);
            toast.success(t("sessions.sessionClosed"));
            refreshAll();
          } catch (err) {
            if (err?.status === 409) toast.error(t("sessions.closeBlocked"));
            else toast.error(err?.message || t("common.unknownError"));
          }
        }}
        title={t("sessions.closeSession")}
        message={t("sessions.closeSessionConfirm", { number: closing?.table?.number ?? "—" })}
        confirmLabel={t("sessions.closeSession")}
      />

      <OpenSessionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onDone={() => {
          toast.success(t("sessions.openSession"));
          reload({ silent: true });
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Session detail                                                             */
/* -------------------------------------------------------------------------- */

function SessionDetailModal({ open, onClose, request, onPay, onClose_ }) {
  const { t, lang } = useI18n();
  const session = request.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("sessions.sessionDetails")}
      size="lg"
      footer={
        session && session.status !== "closed" ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t("common.close")}
            </button>
            {session.payment ? (
              <button type="button" className="btn btn-success" onClick={() => onClose_(session)}>
                {t("sessions.closeSession")}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => onPay(session)}>
                <IconCash size={16} />
                {t("sessions.recordPayment")}
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("common.close")}
          </button>
        )
      }
    >
      {request.loading && !session && <Loading />}
      {session && (
        <div className="stack gap-5">
          <div className="row between wrap gap-3">
            <div className="stack">
              <span className="text-xs text-muted">{t("orders.table")}</span>
              <strong className="num">{session.table?.number ?? "—"}</strong>
            </div>
            <div className="stack">
              <span className="text-xs text-muted">{t("sessions.customerName")}</span>
              <strong>{session.customerName || "—"}</strong>
            </div>
            <div className="stack">
              <span className="text-xs text-muted">{t("sessions.customerPhone")}</span>
              <strong className="num" dir="ltr">
                {session.customerPhone || "—"}
              </strong>
            </div>
            <div className="stack">
              <span className="text-xs text-muted">{t("sessions.openedAt")}</span>
              <strong className="num text-sm">{formatDateTime(session.openedAt, lang)}</strong>
            </div>
            <SessionStatusBadge status={session.status} size="lg" />
          </div>

          <div>
            <h3 className="card-title mb-3">{t("orders.title")}</h3>
            {session.orders?.length ? (
              <div className="stack gap-4">
                {session.orders.map((order) => (
                  <div className="card card-pad" key={order.id}>
                    <div className="row between mb-3 gap-2 wrap">
                      <strong className="num">#{order.number}</strong>
                      <span className="text-xs text-muted num">
                        {formatTime(order.createdAt, lang)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <OrderLines items={order.items} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t("customer.bill.empty")}</p>
            )}
          </div>

          <div className="bill-summary">
            <div className="b-row">
              <span>{t("common.subtotal")}</span>
              <span className="num">{formatMoney(session.bill?.subtotal ?? 0, lang)}</span>
            </div>
            {session.bill?.tax > 0 && (
              <div className="b-row">
                <span>
                  {t("customer.cart.tax")} ({session.bill.taxRate}%)
                </span>
                <span className="num">{formatMoney(session.bill.tax, lang)}</span>
              </div>
            )}
            {session.bill?.service > 0 && (
              <div className="b-row">
                <span>
                  {t("customer.cart.service")} ({session.bill.serviceRate}%)
                </span>
                <span className="num">{formatMoney(session.bill.service, lang)}</span>
              </div>
            )}
            <div className="b-total">
              <span>{t("sessions.totalAmount")}</span>
              <span className="num">{formatMoney(session.bill?.total ?? 0, lang)}</span>
            </div>
          </div>

          {session.payment && (
            <div className="alert alert-success">
              {session.payment.method === "cash" ? <IconCash size={18} /> : <IconCard size={18} />}
              <span>
                {t("sessions.paymentRecorded")} —{" "}
                {t(`sessions.${session.payment.method}`)} ·{" "}
                <span className="num">{formatMoney(session.payment.amount, lang)}</span> ·{" "}
                <span className="num">{formatTime(session.payment.at, lang)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Payment                                                                    */
/* -------------------------------------------------------------------------- */

function PaymentModal({ session, onClose, onDone }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [busy, setBusy] = useState(false);

  const total = session?.bill?.total ?? 0;
  const change = Math.max(0, (Number(received) || 0) - total);

  const submit = async () => {
    setBusy(true);
    try {
      await sessionsApi.recordPayment(session.id, {
        method,
        received: received === "" ? total : Number(received),
      });
      onDone();
      onClose();
    } catch (err) {
      toast.error(err?.message || t("common.unknownError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(session)}
      onClose={busy ? undefined : onClose}
      title={t("sessions.recordPayment")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />}
            {t("sessions.confirmPayment")}
          </button>
        </>
      }
    >
      {session && (
        <div className="stack gap-5">
          <div className="bill-summary" style={{ borderBlockStart: "none", paddingBlockStart: 0 }}>
            <div className="b-row">
              <span>{t("orders.table")}</span>
              <span className="fw-700 num">{session.table?.number ?? "—"}</span>
            </div>
            <div className="b-total">
              <span>{t("sessions.totalAmount")}</span>
              <span className="num">{formatMoney(total, lang)}</span>
            </div>
          </div>

          <div className="field">
            <span className="label">{t("sessions.paymentMethod")}</span>
            <div className="payment-methods">
              <button
                type="button"
                className={`payment-option ${method === "cash" ? "selected" : ""}`}
                onClick={() => setMethod("cash")}
                aria-pressed={method === "cash"}
              >
                <IconCash size={24} />
                {t("sessions.cash")}
              </button>
              <button
                type="button"
                className={`payment-option ${method === "card" ? "selected" : ""}`}
                onClick={() => setMethod("card")}
                aria-pressed={method === "card"}
              >
                <IconCard size={24} />
                {t("sessions.card")}
              </button>
            </div>
          </div>

          {method === "cash" && (
            <div className="field">
              <label className="label" htmlFor="received">
                {t("sessions.amountReceived")}
              </label>
              <input
                id="received"
                type="number"
                min="0"
                step="0.5"
                className="input"
                placeholder={String(total)}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
              />
              {change > 0 && (
                <span className="field-hint">
                  {t("sessions.change")}: <strong className="num">{formatMoney(change, lang)}</strong>
                </span>
              )}
            </div>
          )}

          <div className="alert alert-info">
            <IconReceipt size={17} />
            <span>{t("sessions.closeSessionConfirm", { number: session.table?.number ?? "—" })}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Staff-side session open                                                    */
/* -------------------------------------------------------------------------- */

function OpenSessionModal({ open, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ tableId: "", customerName: "", customerPhone: "" });

  const tables = useAsync(() => (open ? tablesApi.list() : Promise.resolve([])), [open], {
    immediate: open,
  });
  const freeTables = (tables.data || []).filter((tbl) => !tbl.activeSession);

  const submit = async (e) => {
    e.preventDefault();
    if (!values.tableId) return;
    setBusy(true);
    try {
      await sessionsApi.open({
        tableId: Number(values.tableId),
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
      });
      onDone();
      onClose();
      setValues({ tableId: "", customerName: "", customerPhone: "" });
    } catch (err) {
      if (err?.status === 409) toast.error(t("sessions.tableOccupied"));
      else toast.error(err?.message || t("common.unknownError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("sessions.openSession")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            form="open-session-form"
            className="btn btn-primary"
            disabled={busy || !values.tableId}
          >
            {busy && <span className="spinner" />}
            {t("sessions.openSession")}
          </button>
        </>
      }
    >
      <form id="open-session-form" className="stack gap-4" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="stable">
            {t("orders.table")}
            <span className="req">*</span>
          </label>
          <select
            id="stable"
            className="select"
            value={values.tableId}
            onChange={(e) => setValues((v) => ({ ...v, tableId: e.target.value }))}
            required
          >
            <option value="">—</option>
            {freeTables.map((tbl) => (
              <option key={tbl.id} value={tbl.id}>
                {t("tables.table")} {tbl.number} · {t("tables.seats", { count: tbl.capacity })}
              </option>
            ))}
          </select>
          {freeTables.length === 0 && !tables.loading && (
            <span className="field-hint">{t("tables.noTables")}</span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="scustomer">
            {t("sessions.customerName")}
          </label>
          <input
            id="scustomer"
            className="input"
            value={values.customerName}
            onChange={(e) => setValues((v) => ({ ...v, customerName: e.target.value }))}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="sphone">
            {t("sessions.customerPhone")}
          </label>
          <input
            id="sphone"
            className="input"
            dir="ltr"
            inputMode="tel"
            value={values.customerPhone}
            onChange={(e) => setValues((v) => ({ ...v, customerPhone: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
}
