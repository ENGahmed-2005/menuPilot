import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useToast } from "../context/contexts";
import { useI18n } from "../i18n/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { usePolling } from "../hooks/usePolling";
import { sessionsApi } from "../api/services";
import { POLL_INTERVAL } from "../utils/status";
import LanguageToggle from "../components/ui/LanguageToggle";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  IconChef,
  IconDashboard,
  IconLogo,
  IconLogout,
  IconMenu,
  IconMenuBook,
  IconReceipt,
  IconSettings,
  IconTable,
  IconUsers,
} from "../components/ui/Icons";
import "./AdminLayout.css";

const NAV = [
  { to: "/admin", end: true, key: "nav.dashboard", Icon: IconDashboard },
  { to: "/admin/orders", key: "nav.orders", Icon: IconReceipt, badge: "orders" },
  { to: "/admin/sessions", key: "nav.sessions", Icon: IconUsers, badge: "bills" },
  { to: "/admin/tables", key: "nav.tables", Icon: IconTable },
  { to: "/admin/menu", key: "nav.menu", Icon: IconMenuBook },
  { to: "/admin/settings", key: "nav.settings", Icon: IconSettings },
];

export default function AdminLayout() {
  const { t } = useI18n();
  const { user, restaurant, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  /** Sidebar badges + bill-request alerts (FR-28). */
  const { data: activeSessions, reload: refreshCounters } = useAsync(
    () => sessionsApi.list({ scope: "active" }).catch(() => []),
    []
  );

  usePolling(() => refreshCounters({ silent: true }), POLL_INTERVAL.sessions);

  const billAlerts = useMemo(
    () =>
      (activeSessions || []).filter((s) =>
        ["bill_requested", "payment_pending"].includes(s.status)
      ),
    [activeSessions]
  );

  const counters = useMemo(
    () => ({
      orders: (activeSessions || []).filter((s) =>
        ["ordering", "preparing", "ready"].includes(s.status)
      ).length,
      bills: billAlerts.length,
    }),
    [activeSessions, billAlerts]
  );

  const handleLogout = async () => {
    await logout();
    toast.success(t("common.logout"));
    navigate("/login", { replace: true });
  };

  const initials = (user?.name || "?").trim().charAt(0).toUpperCase();
  const activeItem = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  );

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <IconLogo size={32} />
          <div className="brand-text">
            <span className="brand-name">menuPilot</span>
            <span className="brand-sub">{restaurant?.name || ""}</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label={t("nav.mainMenu")}>
          {NAV.map(({ to, end, key, Icon, badge }) => {
            const count = badge ? counters[badge] : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{t(key)}</span>
                {count > 0 && <span className="nav-badge num">{count}</span>}
              </NavLink>
            );
          })}

          <span className="nav-label">{t("kitchen.title")}</span>
          <NavLink
            to="/kitchen"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <IconChef size={19} />
            <span>{t("nav.openKitchen")}</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <div className="stack" style={{ minWidth: 0 }}>
              <span className="u-name truncate">{user?.name}</span>
              <span className="u-mail truncate">{user?.email}</span>
            </div>
          </div>
          <button type="button" className="sidebar-action" onClick={() => setLogoutOpen(true)}>
            <IconLogout size={18} />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="btn btn-ghost btn-icon sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={t("nav.mainMenu")}
          >
            <IconMenu size={20} />
          </button>

          <span className="topbar-title">{activeItem ? t(activeItem.key) : "menuPilot"}</span>

          <div className="grow" />

          {billAlerts.length > 0 && (
            <button
              type="button"
              className="alert-pill"
              onClick={() => navigate("/admin/sessions")}
              title={t("sessions.alerts")}
            >
              <IconReceipt size={15} />
              <span>
                {t("sessions.billRequestAlert", {
                  number: billAlerts[0].table?.number ?? "—",
                })}
                {billAlerts.length > 1 ? ` +${billAlerts.length - 1}` : ""}
              </span>
            </button>
          )}

          <LanguageToggle />
        </header>

        <main className="admin-content">
          <Outlet context={{ refreshCounters }} />
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title={t("common.logout")}
        message={t("auth.logoutConfirm")}
        confirmLabel={t("common.logout")}
        danger
      />
    </div>
  );
}
