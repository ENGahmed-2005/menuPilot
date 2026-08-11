import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useAuth, useToast } from "../../context/contexts";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import LanguageToggle from "../../components/ui/LanguageToggle";
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLogo,
  IconMail,
  IconStore,
  IconUser,
} from "../../components/ui/Icons";
import "./Auth.css";

/** FR-01 — restaurant owner registration with email + password. */
export default function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    initialValues: {
      restaurantName: "",
      ownerName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      terms: false,
    },
    schema: {
      restaurantName: [rules.required(), rules.minLength(2), rules.maxLength(80)],
      ownerName: [rules.required(), rules.minLength(2), rules.maxLength(60)],
      email: [rules.required(), rules.email()],
      password: [rules.required(), rules.minLength(8)],
      passwordConfirmation: [rules.required(), rules.matches("password")],
    },
    onSubmit: async (values, { setFormError }) => {
      if (!values.terms) {
        setFormError({ message: t("auth.acceptTerms") });
        return;
      }
      await register({
        restaurantName: values.restaurantName.trim(),
        ownerName: values.ownerName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(t("auth.registerTitle"));
      navigate("/admin", { replace: true });
    },
  });

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="aside-brand">
          <IconLogo size={34} />
          <span>menuPilot</span>
        </div>

        <div>
          <h1 className="aside-title">{t("landing.heroTitle")}</h1>
          <p className="aside-text">{t("landing.heroSubtitle")}</p>

          <div className="auth-points">
            {["landing.f1Text", "landing.f2Text", "landing.f3Text"].map((key) => (
              <div key={key} className="auth-point">
                <span className="tick">
                  <IconCheck size={14} />
                </span>
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          © 2026 menuPilot
        </p>
      </aside>

      <div className="auth-main">
        <div className="auth-main-top">
          <LanguageToggle />
        </div>

        <div className="auth-card">
          <div className="auth-mobile-brand">
            <IconLogo size={30} />
            <span>menuPilot</span>
          </div>

          <h1 className="auth-title">{t("auth.registerTitle")}</h1>
          <p className="auth-subtitle">{t("auth.registerSubtitle")}</p>

          <form className="auth-form" onSubmit={form.handleSubmit} noValidate>
            {form.formError && (
              <div className="alert alert-error" role="alert">
                {form.formError.message || t("common.unknownError")}
              </div>
            )}

            <div className={`field ${form.errorText("restaurantName") ? "has-error" : ""}`}>
              <label className="label" htmlFor="restaurantName">
                {t("auth.restaurantName")}
                <span className="req">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon">
                  <IconStore size={18} />
                </span>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  className="input"
                  value={form.values.restaurantName}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  aria-invalid={Boolean(form.errorText("restaurantName"))}
                />
              </div>
              {form.errorText("restaurantName") && (
                <span className="field-error">{form.errorText("restaurantName")}</span>
              )}
            </div>

            <div className={`field ${form.errorText("ownerName") ? "has-error" : ""}`}>
              <label className="label" htmlFor="ownerName">
                {t("auth.ownerName")}
                <span className="req">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon">
                  <IconUser size={18} />
                </span>
                <input
                  id="ownerName"
                  name="ownerName"
                  className="input"
                  autoComplete="name"
                  value={form.values.ownerName}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  aria-invalid={Boolean(form.errorText("ownerName"))}
                />
              </div>
              {form.errorText("ownerName") && (
                <span className="field-error">{form.errorText("ownerName")}</span>
              )}
            </div>

            <div className={`field ${form.errorText("email") ? "has-error" : ""}`}>
              <label className="label" htmlFor="reg-email">
                {t("common.email")}
                <span className="req">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon">
                  <IconMail size={18} />
                </span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="input"
                  dir="ltr"
                  autoComplete="email"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  aria-invalid={Boolean(form.errorText("email"))}
                />
              </div>
              {form.errorText("email") && (
                <span className="field-error">{form.errorText("email")}</span>
              )}
            </div>

            <div className="form-row">
              <div className={`field ${form.errorText("password") ? "has-error" : ""}`}>
                <label className="label" htmlFor="reg-password">
                  {t("common.password")}
                  <span className="req">*</span>
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconLock size={18} />
                  </span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    dir="ltr"
                    autoComplete="new-password"
                    value={form.values.password}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    aria-invalid={Boolean(form.errorText("password"))}
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
                {form.errorText("password") ? (
                  <span className="field-error">{form.errorText("password")}</span>
                ) : (
                  <span className="field-hint">{t("auth.passwordHint")}</span>
                )}
              </div>

              <div className={`field ${form.errorText("passwordConfirmation") ? "has-error" : ""}`}>
                <label className="label" htmlFor="passwordConfirmation">
                  {t("auth.confirmPassword")}
                  <span className="req">*</span>
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconLock size={18} />
                  </span>
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    dir="ltr"
                    autoComplete="new-password"
                    value={form.values.passwordConfirmation}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    aria-invalid={Boolean(form.errorText("passwordConfirmation"))}
                  />
                </div>
                {form.errorText("passwordConfirmation") && (
                  <span className="field-error">{form.errorText("passwordConfirmation")}</span>
                )}
              </div>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="terms"
                checked={form.values.terms}
                onChange={form.handleChange}
              />
              <span>{t("auth.acceptTerms")}</span>
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={form.submitting}
            >
              {form.submitting && <span className="spinner" />}
              {form.submitting ? t("auth.registering") : t("auth.register")}
            </button>
          </form>

          <p className="auth-footer">
            {t("auth.hasAccount")} <Link to="/login">{t("auth.loginHere")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
