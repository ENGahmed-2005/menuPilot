import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useAsync } from "../../hooks/useAsync";
import { useForm } from "../../hooks/useForm";
import { publicApi } from "../../api/services";
import { rules } from "../../utils/validation";
import { localized } from "../../utils/format";
import { getStoredSession, storeSession } from "../../utils/session";
import LanguageToggle from "../../components/ui/LanguageToggle";
import { Loading } from "../../components/ui/States";
import {
  IconAlert,
  IconCheck,
  IconPhone,
  IconQr,
  IconStore,
  IconUser,
  IconUsers,
} from "../../components/ui/Icons";
import "./Customer.css";

function InfoScreen({ icon: Icon, tint = "danger", title, text, action }) {
  return (
    <div className="cust-info">
      <div
        className="ci-icon"
        style={{ background: `var(--${tint}-50)`, color: `var(--${tint}-600)` }}
      >
        <Icon size={34} />
      </div>
      <h1>{title}</h1>
      <p>{text}</p>
      {action}
    </div>
  );
}

/**
 * QR landing page (FR-11, FR-24, FR-26).
 * Resolves the scanned token, then collects name + phone to open the session.
 */
export default function SessionStartPage() {
  const { qrToken } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsync(
    () => publicApi.resolveQr(qrToken),
    [qrToken]
  );

  // Resume an in-progress session on this device instead of asking again.
  useEffect(() => {
    if (!data) return;
    const stored = getStoredSession(qrToken);
    if (stored && data.activeSession?.code === stored) {
      navigate(`/s/${stored}`, { replace: true });
    }
  }, [data, qrToken, navigate]);

  const form = useForm({
    initialValues: { customerName: "", customerPhone: "" },
    schema: {
      customerName: [rules.required(), rules.minLength(2), rules.maxLength(40)],
      customerPhone: [rules.required(), rules.phone()],
    },
    onSubmit: async (values, { setFormError }) => {
      try {
        const result = await publicApi.startSession(qrToken, {
          customerName: values.customerName.trim(),
          customerPhone: values.customerPhone.trim(),
        });
        storeSession(qrToken, result.session.code);
        navigate(`/s/${result.session.code}`, { replace: true });
      } catch (err) {
        if (err?.status === 409) {
          setFormError({ message: t("customer.session.tableBusy") });
          reload({ silent: true });
          return;
        }
        throw err;
      }
    },
  });

  if (loading && !data) {
    return (
      <div className="cust-info">
        <Loading />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <InfoScreen
        icon={IconQr}
        title={t("customer.session.invalidQr")}
        text={t("customer.session.invalidQrHint")}
      />
    );
  }

  if (error) {
    return (
      <InfoScreen
        icon={IconAlert}
        title={t("common.unknownError")}
        text={error.isNetwork ? t("common.networkError") : error.message}
        action={
          <button type="button" className="btn btn-primary mt-4" onClick={() => reload()}>
            {t("common.retry")}
          </button>
        }
      />
    );
  }

  // Someone else's session is already running on this table (FR-26).
  const stored = getStoredSession(qrToken);
  if (data.activeSession && data.activeSession.code !== stored) {
    return (
      <InfoScreen
        icon={IconUsers}
        tint="warning"
        title={t("customer.session.tableBusy")}
        text={t("customer.session.tableBusyHint")}
        action={
          <button type="button" className="btn btn-secondary mt-4" onClick={() => reload()}>
            {t("common.refresh")}
          </button>
        }
      />
    );
  }

  const restaurantName = localized(data.restaurant, "name", lang);

  return (
    <div className="cust-start">
      <header className="start-hero">
        <div className="row end">
          <LanguageToggle compact className="text-white" />
        </div>

        <div className="h-logo">
          {data.restaurant.logoUrl ? (
            <img src={data.restaurant.logoUrl} alt="" />
          ) : (
            <IconStore size={30} />
          )}
        </div>

        <h1>{t("customer.welcomeTo", { name: restaurantName })}</h1>

        <span className="h-table">
          <IconQr size={16} />
          {t("customer.tableNumber", { number: data.table.number })}
        </span>
      </header>

      <form className="start-form" onSubmit={form.handleSubmit} noValidate>
        <div>
          <h2 className="s-title">{t("customer.startSession")}</h2>
          <p className="s-sub">{t("customer.startSessionSubtitle")}</p>
        </div>

        {form.formError && (
          <div className="alert alert-error" role="alert">
            {form.formError.message || t("common.unknownError")}
          </div>
        )}

        <div className={`field ${form.errorText("customerName") ? "has-error" : ""}`}>
          <label className="label" htmlFor="cname">
            {t("customer.yourName")}
            <span className="req">*</span>
          </label>
          <div className="input-group">
            <span className="input-icon">
              <IconUser size={18} />
            </span>
            <input
              id="cname"
              name="customerName"
              className="input"
              autoComplete="given-name"
              placeholder={t("customer.yourNamePlaceholder")}
              value={form.values.customerName}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-invalid={Boolean(form.errorText("customerName"))}
            />
          </div>
          {form.errorText("customerName") && (
            <span className="field-error">{form.errorText("customerName")}</span>
          )}
        </div>

        <div className={`field ${form.errorText("customerPhone") ? "has-error" : ""}`}>
          <label className="label" htmlFor="cphone">
            {t("customer.yourPhone")}
            <span className="req">*</span>
          </label>
          <div className="input-group">
            <span className="input-icon">
              <IconPhone size={18} />
            </span>
            <input
              id="cphone"
              name="customerPhone"
              className="input"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("customer.yourPhonePlaceholder")}
              value={form.values.customerPhone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-invalid={Boolean(form.errorText("customerPhone"))}
            />
          </div>
          {form.errorText("customerPhone") ? (
            <span className="field-error">{form.errorText("customerPhone")}</span>
          ) : (
            <span className="field-hint">{t("customer.phoneHint")}</span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={form.submitting}>
          {form.submitting && <span className="spinner" />}
          {form.submitting ? t("customer.starting") : t("customer.startSession")}
        </button>

        <div className="grow" />

        <p className="start-footnote">
          <IconCheck size={15} />
          {t("customer.noAppNeeded")}
        </p>
      </form>
    </div>
  );
}
