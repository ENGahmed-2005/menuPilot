import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { formatMoney, localized } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import { IconMenuBook, IconMinus, IconPlus } from "../../components/ui/Icons";

/**
 * Bottom-sheet style editor for a menu item or an existing cart line.
 * Captures quantity (FR-13) and a per-item note (FR-14) before adding
 * or updating the cart.
 *
 * The caller renders this with a `key` tied to the item, so opening a
 * different item remounts the sheet with fresh state instead of syncing
 * props into state from an effect.
 */
function ItemSheetBody({
  item,
  onClose,
  onConfirm,
  initialQuantity = 1,
  initialNote = "",
  mode = "add",
}) {
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [note, setNote] = useState(initialNote);

  const total = item.price * quantity;
  const confirmKey =
    mode === "edit" ? "customer.itemModal.updateCart" : "customer.itemModal.addToCart";

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={localized(item, "name", lang)}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(quantity, note.trim())}
          >
            {t(confirmKey, { total: formatMoney(total, lang) })}
          </button>
        </>
      }
    >
      <div className="stack gap-5">
        <div className="sheet-hero">
          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <IconMenuBook size={44} />}
        </div>

        {localized(item, "description", lang) && (
          <p className="text-soft text-sm">{localized(item, "description", lang)}</p>
        )}

        <div className="row between gap-4">
          <span className="fw-800 num text-lg text-brand">{formatMoney(item.price, lang)}</span>
          <div className="qty-control">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={t("common.quantity")}
            >
              <IconMinus size={17} />
            </button>
            <span className="q-value num" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label={t("common.quantity")}
            >
              <IconPlus size={17} />
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="item-note">
            {t("customer.itemModal.note")}{" "}
            <span className="text-muted fw-500">({t("common.optional")})</span>
          </label>
          <textarea
            id="item-note"
            className="textarea"
            rows={3}
            maxLength={240}
            placeholder={t("customer.itemModal.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="field-hint">{t("customer.itemModal.noteHint")}</span>
        </div>
      </div>
    </Modal>
  );
}

/** Renders nothing until an item is selected; remounts per item. */
export default function ItemSheet({ item, ...rest }) {
  if (!item) return null;
  return <ItemSheetBody key={item.id ?? item.key} item={item} {...rest} />;
}

