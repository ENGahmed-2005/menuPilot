import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useI18n } from "../../i18n/I18nContext";
import { useToast } from "../../context/contexts";
import { tableQrUrl } from "../../utils/session";
import Modal from "../ui/Modal";
import { IconCopy, IconDownload, IconPrint, IconQr } from "../ui/Icons";

/**
 * QR preview dialog for a single table: shows the code, the resolvable link,
 * and lets the owner copy, download (PNG), or print it.
 */
export default function QrCodeModal({ open, onClose, table, restaurantName }) {
  const { t } = useI18n();
  const toast = useToast();
  const canvasWrapRef = useRef(null);

  if (!table) return null;

  const url = tableQrUrl(table.qrToken);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.unknownError"));
    }
  };

  const handleDownload = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `menupilot-table-${table.number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;

    win.document.write(`<!doctype html>
<html dir="${document.documentElement.dir}">
<head><meta charset="utf-8"><title>QR - ${table.number}</title>
<style>
  body{font-family:'Cairo',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{border:3px dashed #333;border-radius:16px;padding:36px 28px;text-align:center;max-width:340px}
  .brand{font-size:20px;font-weight:800;margin-bottom:6px}
  .tbl{font-size:34px;font-weight:800;margin:10px 0 14px}
  img{width:250px;height:250px}
  .hint{margin-top:14px;font-size:14px;color:#444}
</style></head>
<body onload="window.print();window.close()">
  <div class="card">
    <div class="brand">${restaurantName || "menuPilot"}</div>
    <div class="tbl">${t("tables.table")} ${table.number}</div>
    <img src="${dataUrl}" alt="QR" />
    <div class="hint">${t("tables.scanToOrder")}</div>
  </div>
</body></html>`);
    win.document.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("tables.qrModalTitle", { number: table.number })}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleDownload}>
            <IconDownload size={16} />
            {t("tables.downloadQr")}
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <IconPrint size={16} />
            {t("tables.printQr")}
          </button>
        </>
      }
    >
      <div className="qr-preview">
        <div className="qr-frame" ref={canvasWrapRef}>
          <span className="qr-caption">{restaurantName || "menuPilot"}</span>
          <QRCodeCanvas
            value={url}
            size={216}
            level="M"
            includeMargin
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
          <span className="qr-caption">
            {t("tables.table")} {table.number} · {t("tables.scanToOrder")}
          </span>
        </div>

        <p className="text-sm text-muted text-center" style={{ maxWidth: 380 }}>
          {t("tables.qrHint")}
        </p>

        <div className="field full">
          <span className="label">{t("tables.qrLinkLabel")}</span>
          <div className="qr-link">
            <input className="input" value={url} readOnly onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={handleCopy}
              aria-label={t("common.copy")}
              title={t("common.copy")}
            >
              <IconCopy size={17} />
            </button>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <IconQr size={16} />
          {t("tables.viewQr")}
        </a>
      </div>
    </Modal>
  );
}
