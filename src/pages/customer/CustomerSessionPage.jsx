import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { publicApi } from "../../api/services";
import { POLL_INTERVAL } from "../../utils/status";
import { localized } from "../../utils/format";
import { CartProvider } from "../../context/CartContext";
import { useCart } from "../../context/contexts";
import LanguageToggle from "../../components/ui/LanguageToggle";
import { Loading } from "../../components/ui/States";
import {
  IconAlert,
  IconCart,
  IconCheckCircle,
  IconMenuBook,
  IconReceipt,
  IconStore,
} from "../../components/ui/Icons";
import MenuTab from "./tabs/MenuTab";
import CartTab from "./tabs/CartTab";
import OrdersTab from "./tabs/OrdersTab";
import BillTab from "./tabs/BillTab";
import "./Customer.css";

const TABS = [
  { key: "menu", labelKey: "customer.tabs.menu", Icon: IconMenuBook },
  { key: "cart", labelKey: "customer.tabs.cart", Icon: IconCart },
  { key: "orders", labelKey: "customer.tabs.orders", Icon: IconCheckCircle },
  { key: "bill", labelKey: "customer.tabs.bill", Icon: IconReceipt },
];

/**
 * Customer session shell: menu, cart, live order tracking, and bill.
 * Polls the session + orders so status changes appear without a refresh (FR-20).
 */
export default function CustomerSessionPage() {
  const { sessionCode } = useParams();

  return (
    // The key remounts the provider per session so its cart initializes
    // from this session's stored lines instead of syncing in an effect.
    <CartProvider key={sessionCode} sessionCode={sessionCode}>
      <SessionShell sessionCode={sessionCode} />
    </CartProvider>
  );
}

function SessionShell({ sessionCode }) {
  const { t, lang } = useI18n();
  const cart = useCart();
  const [tab, setTab] = useState("menu");

  const sessionReq = useAsync(() => publicApi.session(sessionCode), [sessionCode]);
  const ordersReq = useAsync(() => publicApi.orders(sessionCode), [sessionCode]);

  const session = sessionReq.data;
  const orders = useMemo(() => ordersReq.data || [], [ordersReq.data]);

  const refreshLive = useCallback(() => {
    sessionReq.reload({ silent: true });
    ordersReq.reload({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePolling(refreshLive, POLL_INTERVAL.customerOrders, Boolean(session) && session?.status !== "closed");

  // Buzz once per order that becomes ready. Kept in a ref because nothing
  // in the render output depends on which orders were already announced.
  const announcedRef = useRef(new Set());
  useEffect(() => {
    const fresh = orders.filter((o) => o.status === "ready" && !announcedRef.current.has(o.id));
    if (fresh.length === 0) return;
    fresh.forEach((o) => announcedRef.current.add(o.id));
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }, [orders]);

  if (sessionReq.loading && !session) {
    return (
      <div className="cust-info">
        <Loading />
      </div>
    );
  }

  if (sessionReq.error) {
    return (
      <div className="cust-info">
        <div className="ci-icon" style={{ background: "var(--danger-50)", color: "var(--danger-600)" }}>
          <IconAlert size={34} />
        </div>
        <h1>{t("customer.session.expired")}</h1>
        <p>{t("customer.session.expiredHint")}</p>
      </div>
    );
  }

  const closed = session.status === "closed";
  const readyCount = orders.filter((o) => o.status === "ready").length;

  const badgeFor = (key) => {
    if (key === "cart") return cart.count;
    if (key === "orders") return readyCount;
    return 0;
  };

  return (
    <div className="cust">
      <header className="cust-header">
        <span className="c-logo">
          <IconStore size={21} />
        </span>
        <div className="stack grow" style={{ minWidth: 0 }}>
          <span className="c-title truncate">
            {localized(session.restaurant || {}, "name", lang) || t("common.appName")}
          </span>
          <span className="c-sub">
            {t("customer.tableNumber", { number: session.table?.number ?? "—" })} ·{" "}
            {session.customerName}
          </span>
        </div>
        <LanguageToggle compact />
      </header>

      <main className="cust-body">
        {closed && (
          <div className="alert alert-success mb-4">
            <IconCheckCircle size={18} />
            <span>{t("customer.bill.closedHint")}</span>
          </div>
        )}

        {tab === "menu" && (
          <MenuTab
            session={session}
            disabled={closed}
            onGoToCart={() => setTab("cart")}
          />
        )}

        {tab === "cart" && (
          <CartTab
            session={session}
            disabled={closed}
            onBrowse={() => setTab("menu")}
            onPlaced={() => {
              refreshLive();
              setTab("orders");
            }}
          />
        )}

        {tab === "orders" && (
          <OrdersTab orders={orders} loading={ordersReq.loading} onBrowse={() => setTab("menu")} />
        )}

        {tab === "bill" && (
          <BillTab
            sessionCode={sessionCode}
            session={session}
            onBrowse={() => setTab("menu")}
            onChanged={refreshLive}
          />
        )}
      </main>

      {tab === "menu" && cart.count > 0 && !closed && (
        <div className="cart-bar">
          <button type="button" onClick={() => setTab("cart")}>
            <span className="cb-count num">{cart.count}</span>
            <span>{t("customer.cart.title")}</span>
            <span className="cb-total num">
              {new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
                numberingSystem: "latn",
                maximumFractionDigits: 2,
              }).format(cart.subtotal)}{" "}
              {t("common.currency")}
            </span>
          </button>
        </div>
      )}

      <nav className="cust-tabbar" aria-label={t("nav.mainMenu")}>
        {TABS.map(({ key, labelKey, Icon }) => {
          const badge = badgeFor(key);
          return (
            <button
              key={key}
              type="button"
              className={`cust-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
            >
              <Icon size={21} />
              <span>{t(labelKey)}</span>
              {badge > 0 && <span className="tab-badge num">{badge}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
