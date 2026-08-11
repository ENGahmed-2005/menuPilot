import { useI18n } from "../../i18n/I18nContext";
import { formatMoney, localized } from "../../utils/format";
import { IconNote } from "../ui/Icons";

/**
 * Renders order lines with quantity, name, per-item note (FR-14) and line total.
 * Shared by the admin orders view, the kitchen ticket, and the customer bill.
 */
export default function OrderLines({ items = [], showPrices = true }) {
  const { t, lang } = useI18n();

  return (
    <div className="order-items-list">
      {items.map((line, index) => (
        <div className="order-line" key={line.id ?? `${line.itemId}-${index}`}>
          <span className="qty num">{line.quantity}×</span>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="fw-600">{localized(line, "name", lang) || line.name}</div>
            {line.note && (
              <div className="line-note">
                <IconNote size={13} />
                <span>{line.note}</span>
              </div>
            )}
          </div>
          {showPrices && (
            <span className="fw-700 num nowrap">
              {formatMoney((line.price ?? 0) * line.quantity, lang)}
            </span>
          )}
        </div>
      ))}

      {items.length === 0 && <p className="text-sm text-muted">{t("common.items")}: 0</p>}
    </div>
  );
}
