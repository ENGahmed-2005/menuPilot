import { useI18n } from "../../i18n/I18nContext";
import { useAuth, useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { useForm } from "../../hooks/useForm";
import { settingsApi } from "../../api/services";
import { rules } from "../../utils/validation";
import { ErrorState, Loading } from "../../components/ui/States";
import { IconLogout, IconSettings, IconStore } from "../../components/ui/Icons";
import "./Admin.css";

export default function SettingsPage() {
  const { data, loading, error, reload } = useAsync(() => settingsApi.get(), []);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return null;

  // Remount the form once the settings arrive so it initializes from `data`
  // instead of syncing server values into state during render.
  return <SettingsForm key={data.id ?? "settings"} settings={data} />;
}

function SettingsForm({ settings }) {
  const { t, lang, setLang } = useI18n();
  const { user, setRestaurant, logout } = useAuth();
  const toast = useToast();

  const form = useForm({
    initialValues: {
      name: settings.name || "",
      nameEn: settings.nameEn || "",
      logoUrl: settings.logoUrl || "",
      address: settings.address || "",
      contactPhone: settings.contactPhone || "",
      currency: settings.currency || "SAR",
      taxRate: settings.taxRate ?? 0,
      serviceCharge: settings.serviceCharge ?? 0,
      defaultLanguage: settings.defaultLanguage || "ar",
    },
    schema: {
      name: [rules.required(), rules.maxLength(80)],
      contactPhone: [rules.phone()],
      taxRate: [rules.number(), rules.min(0), rules.max(100)],
      serviceCharge: [rules.number(), rules.min(0), rules.max(100)],
    },
    onSubmit: async (values) => {
      const updated = await settingsApi.update({
        ...values,
        taxRate: Number(values.taxRate),
        serviceCharge: Number(values.serviceCharge),
      });
      setRestaurant(updated);
      toast.success(t("settings.saved"));
    },
  });

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="page-subtitle">{t("settings.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit} noValidate style={{ maxWidth: 780 }}>
        <section className="card mb-4">
          <div className="card-header">
            <h2 className="card-title row gap-2">
              <IconStore size={18} />
              {t("settings.restaurantInfo")}
            </h2>
          </div>
          <div className="card-body stack gap-4">
            {form.formError && (
              <div className="alert alert-error">
                {form.formError.message || t("common.unknownError")}
              </div>
            )}

            <div className="form-row">
              <div className={`field ${form.errorText("name") ? "has-error" : ""}`}>
                <label className="label" htmlFor="rname">
                  {t("settings.restaurantName")}
                  <span className="req">*</span>
                </label>
                <input
                  id="rname"
                  name="name"
                  className="input"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
                {form.errorText("name") && (
                  <span className="field-error">{form.errorText("name")}</span>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="rnameEn">
                  {t("settings.restaurantName")} (EN)
                </label>
                <input
                  id="rnameEn"
                  name="nameEn"
                  className="input"
                  dir="ltr"
                  value={form.values.nameEn}
                  onChange={form.handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="raddress">
                {t("settings.address")}
              </label>
              <input
                id="raddress"
                name="address"
                className="input"
                value={form.values.address}
                onChange={form.handleChange}
              />
            </div>

            <div className="form-row">
              <div className={`field ${form.errorText("contactPhone") ? "has-error" : ""}`}>
                <label className="label" htmlFor="rphone">
                  {t("settings.contactPhone")}
                </label>
                <input
                  id="rphone"
                  name="contactPhone"
                  className="input"
                  dir="ltr"
                  inputMode="tel"
                  value={form.values.contactPhone}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
                {form.errorText("contactPhone") && (
                  <span className="field-error">{form.errorText("contactPhone")}</span>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="rlogo">
                  {t("settings.logoUrl")}
                </label>
                <input
                  id="rlogo"
                  name="logoUrl"
                  className="input"
                  dir="ltr"
                  placeholder="https://..."
                  value={form.values.logoUrl}
                  onChange={form.handleChange}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card mb-4">
          <div className="card-header">
            <h2 className="card-title row gap-2">
              <IconSettings size={18} />
              {t("settings.preferences")}
            </h2>
          </div>
          <div className="card-body stack gap-4">
            <div className="form-row">
              <div className={`field ${form.errorText("taxRate") ? "has-error" : ""}`}>
                <label className="label" htmlFor="rtax">
                  {t("settings.taxRate")}
                </label>
                <input
                  id="rtax"
                  name="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input"
                  value={form.values.taxRate}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
                {form.errorText("taxRate") && (
                  <span className="field-error">{form.errorText("taxRate")}</span>
                )}
              </div>

              <div className={`field ${form.errorText("serviceCharge") ? "has-error" : ""}`}>
                <label className="label" htmlFor="rservice">
                  {t("settings.serviceCharge")}
                </label>
                <input
                  id="rservice"
                  name="serviceCharge"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input"
                  value={form.values.serviceCharge}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
                {form.errorText("serviceCharge") && (
                  <span className="field-error">{form.errorText("serviceCharge")}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="rcurrency">
                  {t("settings.currencyCode")}
                </label>
                <select
                  id="rcurrency"
                  name="currency"
                  className="select"
                  value={form.values.currency}
                  onChange={form.handleChange}
                >
                  <option value="SAR">SAR — ر.س</option>
                  <option value="AED">AED — د.إ</option>
                  <option value="EGP">EGP — ج.م</option>
                  <option value="JOD">JOD — د.أ</option>
                  <option value="USD">USD — $</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="rlang">
                  {t("settings.defaultLanguage")}
                </label>
                <select
                  id="rlang"
                  name="defaultLanguage"
                  className="select"
                  value={form.values.defaultLanguage}
                  onChange={(e) => {
                    form.handleChange(e);
                    setLang(e.target.value);
                  }}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
                <span className="field-hint">
                  {t("common.language")}: {lang === "ar" ? "العربية" : "English"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="row gap-3 mb-6">
          <button type="submit" className="btn btn-primary" disabled={form.submitting}>
            {form.submitting && <span className="spinner" />}
            {form.submitting ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>

      <section className="card" style={{ maxWidth: 780 }}>
        <div className="card-header">
          <h2 className="card-title">{t("settings.account")}</h2>
        </div>
        <div className="card-body row between wrap gap-3">
          <div className="stack">
            <strong>{user?.name}</strong>
            <span className="text-sm text-muted" dir="ltr">
              {user?.email}
            </span>
          </div>
          <button type="button" className="btn btn-danger-soft" onClick={() => logout()}>
            <IconLogout size={16} />
            {t("common.logout")}
          </button>
        </div>
      </section>
    </div>
  );
}
