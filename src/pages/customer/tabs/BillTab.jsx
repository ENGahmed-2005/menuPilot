import { useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import { useAsync } from "../../../hooks/useAsync";
import { usePolling } from "../../../hooks/usePolling";
import { publicApi } from "../../../api/services";
import { POLL_INTERVAL } from "../../../utils/status";
import { formatDateTime, formatMoney, formatTime, localized } from "../../../utils/format";
import Modal from "../../../components/ui/Modal";
import { EmptyState, ErrorState, Loading } from "../../../components/ui/States";
import {
  IconCheckCircle,
  IconClock,
  IconNote,
  IconReceipt,
} from "../../../components/ui/Icons";

/**
 * FR-27, FR-28, FR-29 — session bill with the "request bill" action.
 * The bill combines every order placed during the dining session.
 */
export default function BillTab({ sessionCode, session, onBrowse, onChanged }) {
  const { t, lang } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);

  const billReq = useAsync(() => publicApi.bill(sessionCode), [sessionCode]);
  usePolling(
    () => billReq.reload({ silent: true }),
    POLL_INTERVAL.customerOrders,
    session?.status !== "closed"
  );

  const bill = billReq.data;

  const requestBill = async () => {
    setRequesting(true);
    setError(null);
    try {
      await publicApi.requestBill(sessionCode);
      billReq.reload({ silent: true });
      onChanged?.();
      setConfirmOpen(false);
    } catch (err) {
      setError(err?.message || t("common.unknownError"));
    } finally {
      setRequesting(false);
    }
  };

  if (billReq.loading && !bill) return <Loading />;
  if (billReq.error && !bill) return <ErrorState error={billReq.error} onRetry={billReq.reload} />;

  if (!bill?.orders?.length) {
    return (
      <EmptyState
        icon={IconReceipt}
        title={t("customer.bill.empty")}
        text={t("customer.bill.emptyHint")}
        action={
          <button type="button" className="btn btn-primary" onClick={onBrowse}>
            {t("customer.cart.browseMenu")}
          </button>
        }
      />
    );
  }

  const requested = Boolean(bill.billRequestedAt);
  const paid = Boolean(bill.payment);
  const closed = session?.status === "closed";

  return (
    <div className="stack gap-4">
      {closed ? (
        <div className="alert alert-success">
          <IconCheckCircle size={18} />
          <span>{t("customer.bill.closed")}</span>
        </div>
      ) : paid ? (
        <div className="alert alert-success">
          <IconCheckCircle size={18} />
          <span>{t("customer.bill.paid")}</span>
        </div>
      ) : requested ? (
        <div className="alert alert-info">
          <IconClock size={18} />
          <div className="stack">
            <strong>{t("customer.bill.requested")}</strong>
            <span className="text-sm">{t("customer.bill.requestedHint")}</span>
          </div>
        </div>
      ) : null}

      <article className="bill-card">
        <div className="bill-head">
          <div className="bh-name">
            {localized(session?.restaurant || {}, "name", lang) || t("common.appName")}
          </div>
          <div className="bh-meta">
            {t("customer.tableNumber", { number: session?.table?.number ?? "—" })} ·{" "}
            {session?.customerName}
          </div>
          <div className="bh-meta num">{formatDateTime(session?.openedAt, lang)}</div>
        </div>

        {bill.orders.map((order) => (
          <div className="bill-order-group" key={order.id}>
            <div className="bg-head">
              <span className="num">#{order.number}</span>
              <span className="num">{formatTime(order.createdAt, lang)}</span>
              <span className="grow" />
              <span>{t(`orders.status.${order.status}`)}</span>
            </div>

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
        ))}

        <div className="bill-summary">
          <div className="b-row">
            <span>{t("common.subtotal")}</span>
            <span className="num">{formatMoney(bill.subtotal, lang)}</span>
          </div>
          {bill.tax > 0 && (
            <div className="b-row">
              <span>
                {t("customer.cart.tax")} ({bill.taxRate}%)
              </span>
              <span className="num">{formatMoney(bill.tax, lang)}</span>
            </div>
          )}
          {bill.service > 0 && (
            <div className="b-row">
              <span>
                {t("customer.cart.service")} ({bill.serviceRate}%)
              </span>
              <span className="num">{formatMoney(bill.service, lang)}</span>
            </div>
          )}
          <div className="b-total">
            <span>{t("customer.cart.grandTotal")}</span>
            <span className="num">{formatMoney(bill.total, lang)}</span>
          </div>
        </div>

        {paid && (
          <p className="text-sm text-muted text-center mt-4">
            {t("sessions.paymentMethod")}: {t(`sessions.${bill.payment.method}`)} ·{" "}
            <span className="num">{formatTime(bill.payment.at, lang)}</span>
          </p>
        )}
      </article>

      {error && <div className="alert alert-error">{error}</div>}

      {!requested && !paid && !closed && (
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={() => setConfirmOpen(true)}
        >
          <IconReceipt size={18} />
          {t("customer.bill.requestBill")}
        </button>
      )}

      <Modal
        open={confirmOpen}
        onClose={requesting ? undefined : () => setConfirmOpen(false)}
        size="sm"
        title={t("customer.bill.requestBill")}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={requesting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={requestBill}
              disabled={requesting}
            >
              {requesting && <span className="spinner" />}
              {requesting ? t("customer.bill.requesting") : t("common.confirm")}
            </button>
          </>
        }
      >
        <p className="text-soft">{t("customer.bill.requestConfirm")}</p>
        <div className="bill-summary mt-4">
          <div className="b-total">
            <span>{t("customer.cart.grandTotal")}</span>
            <span className="num">{formatMoney(bill.total, lang)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
