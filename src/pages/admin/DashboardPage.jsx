import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { dashboardApi } from "../../api/services";
import { POLL_INTERVAL } from "../../utils/status";
import { formatMoney, relativeTime } from "../../utils/format";
import { OrderStatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, Loading } from "../../components/ui/States";
import {
  IconCash,
  IconChef,
  IconClock,
  IconMenuBook,
  IconReceipt,
  IconTable,
  IconUsers,
} from "../../components/ui/Icons";
import "./Admin.css";

function StatCard({ icon: Icon, label, value, hint, tint }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{ background: `var(--${tint}-50)`, color: `var(--${tint}-600)` }}
      >
        <Icon size={21} />
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <span className="stat-value num">{value}</span>
        <span className="stat-label">{label}</span>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsync(() => dashboardApi.stats(), []);
  usePolling(() => reload({ silent: true }), POLL_INTERVAL.dashboard);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const stats = data || {};

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("dashboard.title")}</h1>
          <p className="page-subtitle">{t("dashboard.subtitle")}</p>
        </div>
        <div className="row gap-2 wrap">
          <Link to="/admin/tables" className="btn btn-secondary btn-sm">
            <IconTable size={16} />
            {t("dashboard.addTable")}
          </Link>
          <Link to="/admin/menu" className="btn btn-secondary btn-sm">
            <IconMenuBook size={16} />
            {t("dashboard.addMenuItem")}
          </Link>
          <Link to="/kitchen" className="btn btn-primary btn-sm">
            <IconChef size={16} />
            {t("dashboard.openKitchenScreen")}
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={IconUsers}
          tint="brand"
          value={stats.activeSessions ?? 0}
          label={t("dashboard.activeSessions")}
        />
        <StatCard
          icon={IconReceipt}
          tint="info"
          value={stats.activeOrders ?? 0}
          label={t("dashboard.activeOrders")}
        />
        <StatCard
          icon={IconTable}
          tint="success"
          value={`${stats.availableTables ?? 0}/${stats.totalTables ?? 0}`}
          label={t("dashboard.availableTables")}
        />
        <StatCard
          icon={IconCash}
          tint="brand"
          value={formatMoney(stats.todayRevenue ?? 0, lang)}
          label={t("dashboard.todayRevenue")}
          hint={t("dashboard.todayOrders") + ": " + (stats.todayOrders ?? 0)}
        />
        <StatCard
          icon={IconClock}
          tint="warning"
          value={`${stats.avgPrepTime ?? 0} ${t("dashboard.minutes")}`}
          label={t("dashboard.avgPrepTime")}
        />
        <StatCard
          icon={IconReceipt}
          tint="purple"
          value={stats.pendingBills ?? 0}
          label={t("dashboard.pendingBills")}
        />
      </div>

      <section className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">{t("dashboard.recentOrders")}</h2>
          <Link to="/admin/orders" className="btn btn-ghost btn-sm">
            {t("dashboard.viewAll")}
          </Link>
        </div>

        {stats.recentOrders?.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orders.orderNumber")}</th>
                  <th>{t("orders.table")}</th>
                  <th>{t("orders.customer")}</th>
                  <th>{t("common.items")}</th>
                  <th>{t("common.total")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("orders.placedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate("/admin/orders")}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-700 num">#{order.number}</td>
                    <td className="num">{order.tableNumber ?? "—"}</td>
                    <td className="truncate" style={{ maxWidth: 160 }}>
                      {order.customerName || "—"}
                    </td>
                    <td className="num">{order.items?.length ?? 0}</td>
                    <td className="fw-600 nowrap">{formatMoney(order.total, lang)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-muted text-sm nowrap">
                      {relativeTime(order.createdAt, t)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={IconReceipt}
            title={t("dashboard.noRecentOrders")}
            text={t("orders.noOrdersHint")}
          />
        )}
      </section>
    </div>
  );
}
