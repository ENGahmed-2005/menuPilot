import { useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCart } from "../../../context/contexts";
import { publicApi } from "../../../api/services";
import { formatMoney, localized } from "../../../utils/format";
import Modal from "../../../components/ui/Modal";
import ItemSheet from "../ItemSheet";
import { EmptyState } from "../../../components/ui/States";
import {
  IconCart,
  IconEdit,
  IconMinus,
  IconNote,
  IconPlus,
  IconTrash,
} from "../../../components/ui/Icons";

/**
 * FR-15, FR-16 — cart review and order submission inside the active session.
 * Lines keep their per-item notes so the kitchen sees them verbatim.
 */
export default function CartTab({ session, disabled, onBrowse, onPlaced }) {
  const { t, lang } = useI18n();
  const cart = useCart();

  const [editingKey, setEditingKey] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const editingLine = cart.lines.find((l) => l.key === editingKey) || null;

  const submitOrder = async () => {
    if (cart.lines.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await publicApi.placeOrder(session.code, cart.toOrderPayload());
      cart.clear();
      onPlaced();
    } catch (err) {
      setSubmitError(
        err?.status === 409
          ? t("customer.menu.unavailable")
          : err?.message || t("common.unknownError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={IconCart}
        title={t("customer.cart.empty")}
        text={t("customer.cart.emptyHint")}
        action={
          <button type="button" className="btn btn-primary" onClick={onBrowse}>
            {t("customer.cart.browseMenu")}
          </button>
        }
      />
    );
  }

  return (
    <div className="stack gap-4">
      <h2 className="card-title">{t("customer.cart.title")}</h2>

      <div className="stack gap-3">
        {cart.lines.map((line) => (
          <div className="cart-line" key={line.key}>
            <div className="cl-body">
              <div className="fw-700">{localized(line, "name", lang)}</div>
              {line.note && (
                <span className="cl-note">
                  <IconNote size={13} />
                  <span>{line.note}</span>
                </span>
              )}
              <div className="cl-foot">
                <div className="qty-control">
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                    aria-label={t("common.quantity")}
                  >
                    <IconMinus size={15} />
                  </button>
                  <span className="q-value num" style={{ minWidth: 34, fontSize: 14 }}>
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                    aria-label={t("common.quantity")}
                  >
                    <IconPlus size={15} />
                  </button>
                </div>
                <span className="fw-700 num" style={{ marginInlineStart: "auto" }}>
                  {formatMoney(line.price * line.quantity, lang)}
                </span>
              </div>
            </div>

            <div className="cl-tools">
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setEditingKey(line.key)}
                aria-label={t("customer.cart.editItem")}
                title={t("customer.cart.editItem")}
              >
                <IconEdit size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon text-danger"
                onClick={() => cart.removeLine(line.key)}
                aria-label={t("customer.cart.removeItem")}
                title={t("customer.cart.removeItem")}
              >
                <IconTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad">
        <div className="bill-summary" style={{ borderBlockStart: "none", paddingBlockStart: 0 }}>
          <div className="b-row">
            <span>{t("customer.cart.itemsTotal")}</span>
            <span className="num">{formatMoney(cart.subtotal, lang)}</span>
          </div>
          <div className="b-total">
            <span>{t("customer.cart.grandTotal")}</span>
            <span className="num">{formatMoney(cart.subtotal, lang)}</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="row gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setConfirmClear(true)}
          disabled={submitting}
        >
          {t("customer.cart.clear")}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg grow"
          onClick={submitOrder}
          disabled={submitting || disabled}
        >
          {submitting && <span className="spinner" />}
          {submitting ? t("customer.cart.placing") : t("customer.cart.placeOrder")}
        </button>
      </div>

      <p className="text-xs text-muted text-center">{t("customer.cart.review")}</p>

      <ItemSheet
        item={editingLine}
        mode="edit"
        initialQuantity={editingLine?.quantity ?? 1}
        initialNote={editingLine?.note ?? ""}
        onClose={() => setEditingKey(null)}
        onConfirm={(quantity, note) => {
          cart.updateLine(editingKey, { quantity, note });
          setEditingKey(null);
        }}
      />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        size="sm"
        title={t("customer.cart.clear")}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClear(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                cart.clear();
                setConfirmClear(false);
              }}
            >
              {t("customer.cart.clear")}
            </button>
          </>
        }
      >
        <p className="text-soft">{t("customer.cart.clearConfirm")}</p>
      </Modal>
    </div>
  );
}
