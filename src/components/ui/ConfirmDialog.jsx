import { useState } from "react";
import Modal from "./Modal";
import { useI18n } from "../../i18n/I18nContext";

/** Confirmation dialog for destructive or irreversible actions. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel || t("common.cancel")}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <span className="spinner" />}
            {confirmLabel || t("common.confirm")}
          </button>
        </>
      }
    >
      <p className="text-soft">{message}</p>
    </Modal>
  );
}
