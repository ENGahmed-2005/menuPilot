import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { useToast } from "../../context/contexts";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { ordersApi } from "../../api/services";
import { LATE_ORDER_MINUTES, POLL_INTERVAL } from "../../utils/status";
import { elapsedSince, formatTime, localized, minutesSince } from "../../utils/format";
import LanguageToggle from "../../components/ui/LanguageToggle";
import { Loading } from "../../components/ui/States";
import {
  IconArrowBack,
  IconBell,
  IconBellOff,
  IconCheck,
  IconChef,
  IconClock,
  IconExpand,
  IconNote,
} from "../../components/ui/Icons";
import "./Kitchen.css";

const COLUMNS = [
  { status: "pending", labelKey: "kitchen.newOrders", color: "var(--warning-500)", action: "kitchen.startPreparing", next: "preparing" },
  { status: "preparing", labelKey: "kitchen.preparing", color: "var(--info-500)", action: "kitchen.markReady", next: "ready" },
  { status: "ready", labelKey: "kitchen.ready", color: "var(--success-500)", action: "kitchen.markServed", next: "served" },
];

/** Short beep used to announce a newly arrived order. */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    gain.connect(ctx.destination);

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.14);
      osc.stop(ctx.currentTime + 0.6);
    });

    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio unavailable */
  }
}

/** FR-18, FR-19, FR-23 — live kitchen board with status transitions. */
export default function KitchenPage() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [soundOn, setSoundOn] = useState(true);
  const [clock, setClock] = useState(() => new Date());
  const [busyId, setBusyId] = useState(null);
  const knownIds = useRef(null);

  const { data, loading, reload } = useAsync(() => ordersApi.kitchenQueue(), []);
  const orders = useMemo(() => data || [], [data]);

  usePolling(() => reload({ silent: true }), POLL_INTERVAL.kitchen);

  // Tick the header clock and ticket ages every second.
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Announce genuinely new tickets (skips the first load).
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.map((o) => o.id));
    if (knownIds.current === null) {
      knownIds.current = ids;
      return;
    }
    const fresh = data.filter((o) => o.status === "pending" && !knownIds.current.has(o.id));
    knownIds.current = ids;
    if (fresh.length > 0) {
      if (soundOn) playChime();
      toast.info(t("kitchen.newOrderArrived", { number: fresh[0].number }));
    }
  }, [data, soundOn, t, toast]);

  const grouped = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => ({ ...acc, [col.status]: orders.filter((o) => o.status === col.status) }),
        {}
      ),
    [orders]
  );

  const advance = useCallback(
    async (order, next) => {
      setBusyId(order.id);
      try {
        await ordersApi.updateStatus(order.id, next);
        reload({ silent: true });
      } catch (err) {
        toast.error(err?.message || t("common.unknownError"));
      } finally {
        setBusyId(null);
      }
    },
    [reload, t, toast]
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  if (loading && !data) {
    return (
      <div className="kitchen" style={{ display: "grid", placeItems: "center" }}>
        <Loading />
      </div>
    );
  }

  return (
    <div className="kitchen">
      <header className="kitchen-header">
        <Link to="/admin" className="btn btn-ghost btn-sm">
          <IconArrowBack size={17} />
          <span className="nowrap">{t("kitchen.backToAdmin")}</span>
        </Link>

        <span className="k-brand">
          <IconChef size={22} />
          <span>{t("kitchen.title")}</span>
        </span>

        <div className="grow" />

        <span className="kitchen-clock num">{formatTime(clock.toISOString(), lang)}</span>

        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setSoundOn((v) => !v)}
          title={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
          aria-label={soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff")}
        >
          {soundOn ? <IconBell size={19} /> : <IconBellOff size={19} />}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={toggleFullscreen}
          title={t("kitchen.fullscreen")}
          aria-label={t("kitchen.fullscreen")}
        >
          <IconExpand size={19} />
        </button>

        <LanguageToggle compact />
      </header>

      <div className="kitchen-stats">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`k-stat ${col.status}`}>
            <span className="k-num num">{grouped[col.status].length}</span>
            <span>{t(col.labelKey)}</span>
          </div>
        ))}
        <div className="k-stat">
          <span>{t("kitchen.autoRefresh", { seconds: POLL_INTERVAL.kitchen / 1000 })}</span>
        </div>
      </div>

      <div className="kitchen-board">
        {COLUMNS.map((col) => (
          <section className="k-column" key={col.status}>
            <header className="k-column-head">
              <span className="k-dot" style={{ background: col.color }} />
              <span>{t(col.labelKey)}</span>
              <span className="k-count num">{grouped[col.status].length}</span>
            </header>

            <div className="k-column-body">
              {grouped[col.status].length === 0 ? (
                <p className="k-empty">{t("kitchen.noOrdersInColumn")}</p>
              ) : (
                grouped[col.status].map((order) => {
                  const late =
                    col.status !== "ready" && minutesSince(order.createdAt) >= LATE_ORDER_MINUTES;
                  return (
                    <article
                      key={order.id}
                      className={`ticket status-${order.status} ${late ? "is-late" : ""}`}
                    >
                      <div className="ticket-head">
                        <span className="ticket-num">#{order.number}</span>
                        <span className="ticket-table num">
                          {t("tables.table")} {order.tableNumber ?? "—"}
                        </span>
                        <span className="ticket-age">
                          <IconClock size={14} />
                          {elapsedSince(order.createdAt)}
                          {late && ` · ${t("kitchen.late")}`}
                        </span>
                      </div>

                      {order.customerName && (
                        <span className="ticket-customer">{order.customerName}</span>
                      )}

                      <div className="ticket-lines">
                        {order.items.map((line, index) => (
                          <div className="ticket-line" key={`${line.itemId}-${index}`}>
                            <span className="t-qty">{line.quantity}×</span>
                            <div style={{ minWidth: 0 }}>
                              <div className="t-name">{localized(line, "name", lang)}</div>
                              {line.note && (
                                <div className="t-note">
                                  <IconNote size={13} />
                                  <span>{line.note}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="ticket-actions">
                        <button
                          type="button"
                          className={`btn ${col.status === "ready" ? "btn-success" : "btn-primary"}`}
                          onClick={() => advance(order, col.next)}
                          disabled={busyId === order.id}
                        >
                          {busyId === order.id ? <span className="spinner" /> : <IconCheck size={17} />}
                          {t(col.action)}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
