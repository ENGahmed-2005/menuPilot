import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useI18n } from "../../i18n/I18nContext";
import { useAuth, useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { useForm } from "../../hooks/useForm";
import { tablesApi } from "../../api/services";
import { rules } from "../../utils/validation";
import { localized, relativeTime } from "../../utils/format";
import { tableQrUrl } from "../../utils/session";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import QrCodeModal from "../../components/admin/QrCodeModal";
import { TableStatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, Loading } from "../../components/ui/States";
import {
  IconEdit,
  IconPlus,
  IconPrint,
  IconQr,
  IconTable,
  IconTrash,
  IconUsers,
} from "../../components/ui/Icons";
import "./Admin.css";

const emptyTable = { number: "", label: "", labelEn: "", capacity: 4 };

/** FR-04..FR-07 — table CRUD with automatic per-table QR generation. */
export default function TablesPage() {
  const { t, lang } = useI18n();
  const { restaurant } = useAuth();
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(() => tablesApi.list(), []);
  const tables = useMemo(
    () => (data || []).slice().sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true })),
    [data]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qrTable, setQrTable] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const form = useForm({
    initialValues: emptyTable,
    schema: {
      number: [rules.required(), rules.maxLength(10)],
      capacity: [rules.required(), rules.number(), rules.min(1), rules.max(50)],
    },
    onSubmit: async (values) => {
      const payload = {
        number: String(values.number).trim(),
        label: values.label?.trim() || "",
        labelEn: values.labelEn?.trim() || "",
        capacity: Number(values.capacity),
      };
      if (editing) {
        await tablesApi.update(editing.id, payload);
        toast.success(t("tables.updated"));
      } else {
        await tablesApi.create(payload);
        toast.success(t("tables.created"));
      }
      setFormOpen(false);
      setEditing(null);
      reload({ silent: true });
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyTable);
    setFormOpen(true);
  };

  const openEdit = (table) => {
    setEditing(table);
    form.reset({
      number: table.number,
      label: table.label || "",
      labelEn: table.labelEn || "",
      capacity: table.capacity,
    });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await tablesApi.remove(deleting.id);
      toast.success(t("tables.deleted"));
      reload({ silent: true });
    } catch (err) {
      if (err?.status === 409) toast.error(t("tables.deleteBlocked"));
      else toast.error(err?.message || t("common.unknownError"));
    }
  };

  const handlePrintAll = () => {
    setPrintOpen(true);
    // Let the QR canvases render before opening the print dialog.
    setTimeout(() => window.print(), 400);
  };

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="animate-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">{t("tables.title")}</h1>
          <p className="page-subtitle">{t("tables.subtitle")}</p>
        </div>
        <div className="row gap-2">
          {tables.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={handlePrintAll}>
              <IconPrint size={17} />
              {t("tables.printAll")}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <IconPlus size={17} />
            {t("tables.addTable")}
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="card no-print">
          <EmptyState
            icon={IconTable}
            title={t("tables.noTables")}
            text={t("tables.noTablesHint")}
            action={
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                <IconPlus size={17} />
                {t("tables.addTable")}
              </button>
            }
          />
        </div>
      ) : (
        <div className="tables-grid no-print">
          {tables.map((table) => {
            const occupied = Boolean(table.activeSession);
            return (
              <article
                key={table.id}
                className={`table-card ${occupied ? "is-occupied" : ""}`}
              >
                <div className="t-head">
                  <div className="row gap-3">
                    <span className="table-number num">{table.number}</span>
                    <div className="stack">
                      <strong style={{ fontSize: 15 }}>
                        {t("tables.table")} {table.number}
                      </strong>
                      <span className="text-xs text-muted">
                        {localized(table, "label", lang) || t("tables.seats", { count: table.capacity })}
                      </span>
                    </div>
                  </div>
                  <TableStatusBadge status={occupied ? "occupied" : "available"} />
                </div>

                <div className="row gap-4 text-sm text-muted">
                  <span className="row gap-1">
                    <IconUsers size={15} />
                    <span className="num">{table.capacity}</span>
                  </span>
                  <span className="row gap-1 truncate">
                    <IconQr size={15} />
                    <span className="text-xs" style={{ direction: "ltr" }}>
                      {table.qrToken}
                    </span>
                  </span>
                </div>

                {occupied && (
                  <div className="table-session">
                    <strong>{table.activeSession.customerName || "—"}</strong>
                    <br />
                    {t("sessions.ordersCount", { count: table.activeSession.ordersCount })} ·{" "}
                    {relativeTime(table.activeSession.openedAt, t)}
                  </div>
                )}

                <div className="t-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm grow"
                    onClick={() => setQrTable(table)}
                  >
                    <IconQr size={15} />
                    {t("tables.qrCode")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => openEdit(table)}
                    aria-label={t("common.edit")}
                    title={t("common.edit")}
                  >
                    <IconEdit size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon text-danger"
                    onClick={() => setDeleting(table)}
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Print sheet: rendered only while printing all QR codes. */}
      {printOpen && (
        <div className="print-only qr-sheet">
          {tables.map((table) => (
            <div key={table.id} className="qr-sheet-card">
              <span className="s-brand">{restaurant?.name || "menuPilot"}</span>
              <span className="s-table">
                {t("tables.table")} {table.number}
              </span>
              <QRCodeCanvas value={tableQrUrl(table.qrToken)} size={190} level="M" includeMargin />
              <span className="s-hint">{t("tables.scanToOrder")}</span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t("tables.editTable") : t("tables.addTable")}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="table-form"
              className="btn btn-primary"
              disabled={form.submitting}
            >
              {form.submitting && <span className="spinner" />}
              {editing ? t("common.save") : t("common.add")}
            </button>
          </>
        }
      >
        <form id="table-form" className="stack gap-4" onSubmit={form.handleSubmit} noValidate>
          {form.formError && (
            <div className="alert alert-error">{form.formError.message || t("common.unknownError")}</div>
          )}

          <div className="form-row">
            <div className={`field ${form.errorText("number") ? "has-error" : ""}`}>
              <label className="label" htmlFor="tnumber">
                {t("tables.tableNumber")}
                <span className="req">*</span>
              </label>
              <input
                id="tnumber"
                name="number"
                className="input"
                value={form.values.number}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
              {form.errorText("number") && (
                <span className="field-error">{form.errorText("number")}</span>
              )}
            </div>

            <div className={`field ${form.errorText("capacity") ? "has-error" : ""}`}>
              <label className="label" htmlFor="tcapacity">
                {t("tables.capacity")}
                <span className="req">*</span>
              </label>
              <input
                id="tcapacity"
                name="capacity"
                type="number"
                min="1"
                max="50"
                className="input"
                value={form.values.capacity}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
              {form.errorText("capacity") && (
                <span className="field-error">{form.errorText("capacity")}</span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="tlabel">
              {t("tables.tableLabel")}{" "}
              <span className="text-muted fw-500">({t("common.optional")})</span>
            </label>
            <input
              id="tlabel"
              name="label"
              className="input"
              value={form.values.label}
              onChange={form.handleChange}
            />
            <span className="field-hint">{t("tables.tableLabelHint")}</span>
          </div>

          <div className="field">
            <label className="label" htmlFor="tlabelEn">
              {t("tables.tableLabel")} (EN){" "}
              <span className="text-muted fw-500">({t("common.optional")})</span>
            </label>
            <input
              id="tlabelEn"
              name="labelEn"
              className="input"
              dir="ltr"
              value={form.values.labelEn}
              onChange={form.handleChange}
            />
          </div>

          {!editing && (
            <div className="alert alert-info">
              <IconQr size={17} />
              <span>{t("tables.qrHint")}</span>
            </div>
          )}
        </form>
      </Modal>

      <QrCodeModal
        open={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
        table={qrTable}
        restaurantName={restaurant?.name}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t("tables.deleteTable")}
        message={t("tables.deleteConfirm", { number: deleting?.number })}
        confirmLabel={t("common.delete")}
        danger
      />
    </div>
  );
}
