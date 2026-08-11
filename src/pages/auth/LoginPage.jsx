import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
} from "../../components/ui/Icons";
import "./Auth.css";

/** FR-02 — secure owner login. NFR-02 lockout feedback is surfaced here. */
export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    initialValues: { email: "", password: "", remember: true },
    schema: {
      email: [rules.required(), rules.email()],
      password: [rules.required(), rules.minLength(8)],
    },
    onSubmit: async (values, { setFormError }) => {
      try {
        await login({ email: values.email.trim(), password: values.password });
        toast.success(t("auth.loginTitle"));
        navigate(location.state?.from || "/admin", { replace: true });
      } catch (err) {
        if (err?.status === 401) {
          setFormError({ message: t("auth.invalidCredentials") });
          return;
        }
        if (err?.status === 423) {
          setFormError({ message: t("auth.accountLocked") });
          return;
        }
        throw err;
      }
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
            {["landing.f1Title", "landing.f2Title", "landing.f3Title", "landing.f4Title"].map(
              (key) => (
                <div key={key} className="auth-point">
                  <span className="tick">
                    <IconCheck size={14} />
                  </span>
                  <span>{t(key)}</span>
                </div>
              )
            )}
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

          <h1 className="auth-title">{t("auth.loginTitle")}</h1>
          <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>

          <form className="auth-form" onSubmit={form.handleSubmit} noValidate>
            {form.formError && (
              <div className="alert alert-error" role="alert">
                {form.formError.message || t("common.unknownError")}
              </div>
            )}

            <div className={`field ${form.errorText("email") ? "has-error" : ""}`}>
              <label className="label" htmlFor="email">
                {t("common.email")}
                <span className="req">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon">
                  <IconMail size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="owner@menupilot.app"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  aria-invalid={Boolean(form.errorText("email"))}
                  aria-describedby={form.errorText("email") ? "email-error" : undefined}
                />
              </div>
              {form.errorText("email") && (
                <span className="field-error" id="email-error">
                  {form.errorText("email")}
                </span>
              )}
            </div>

            <div className={`field ${form.errorText("password") ? "has-error" : ""}`}>
              <label className="label" htmlFor="password">
                {t("common.password")}
                <span className="req">*</span>
              </label>
              <div className="input-group">
                <span className="input-icon">
                  <IconLock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  aria-invalid={Boolean(form.errorText("password"))}
                  aria-describedby={form.errorText("password") ? "password-error" : undefined}
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
              {form.errorText("password") && (
                <span className="field-error" id="password-error">
                  {form.errorText("password")}
                </span>
              )}
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="remember"
                checked={form.values.remember}
                onChange={form.handleChange}
              />
              <span>{t("auth.rememberMe")}</span>
            </label>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={form.submitting}>
              {form.submitting && <span className="spinner" />}
              {form.submitting ? t("auth.loggingIn") : t("auth.login")}
            </button>

            <div className="demo-hint">
              <strong>Demo:</strong> <code>owner@menupilot.app</code> / <code>password123</code>
            </div>
          </form>

          <p className="auth-footer">
            {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
