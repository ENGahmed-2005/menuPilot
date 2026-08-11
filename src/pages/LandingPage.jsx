import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import LanguageToggle from "../components/ui/LanguageToggle";
import {
  IconChef,
  IconLogo,
  IconQr,
  IconReceipt,
  IconUsers,
} from "../components/ui/Icons";
import "./auth/Auth.css";

const FEATURES = [
  { icon: IconQr, title: "landing.f1Title", text: "landing.f1Text" },
  { icon: IconChef, title: "landing.f2Title", text: "landing.f2Text" },
  { icon: IconReceipt, title: "landing.f3Title", text: "landing.f3Text" },
  { icon: IconUsers, title: "landing.f4Title", text: "landing.f4Text" },
];

const STEPS = ["landing.s1", "landing.s2", "landing.s3", "landing.s4"];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container">
          <div className="landing-brand">
            <IconLogo size={30} />
            <span>menuPilot</span>
          </div>
          <div className="grow" />
          <LanguageToggle />
          <Link to="/login" className="btn btn-secondary btn-sm">
            {t("landing.ctaSecondary")}
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            {t("landing.ctaPrimary")}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="container">
          <div>
            <h1 className="hero-title">{t("landing.heroTitle")}</h1>
            <p className="hero-text">{t("landing.heroSubtitle")}</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                {t("landing.ctaPrimary")}
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                {t("landing.ctaSecondary")}
              </Link>
            </div>
            <p className="text-sm text-muted mt-4">{t("customer.noAppNeeded")}</p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="phone-mock">
              <div className="phone-screen">
                <div className="phone-topline" />
                <div className="row between">
                  <strong style={{ fontSize: 14 }}>{t("customer.menu.title")}</strong>
                  <span className="badge badge-brand">{t("customer.tableNumber", { number: 4 })}</span>
                </div>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="mock-card">
                    <div className="mock-thumb" />
                    <div className="stack gap-2 grow">
                      <div className="mock-line" style={{ width: `${70 - i * 8}%` }} />
                      <div className="mock-line" style={{ width: "40%", height: 7 }} />
                    </div>
                  </div>
                ))}
                <div className="grow" />
                <div className="btn btn-primary btn-block">{t("customer.cart.placeOrder")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <h2 className="section-title">{t("landing.features")}</h2>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="feature-card">
                <div className="f-icon">
                  <Icon size={22} />
                </div>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section alt">
        <div className="container">
          <h2 className="section-title">{t("landing.howItWorks")}</h2>
          <div className="steps">
            {STEPS.map((key, index) => (
              <div key={key} className="step">
                <div className="num-circle num">{index + 1}</div>
                <p>{t(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">© 2026 menuPilot — {t("common.tagline")}</div>
      </footer>
    </div>
  );
}
