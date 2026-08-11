/**
 * Order and dining-session status metadata shared by every screen.
 * Keeping it in one place keeps colors, order, and transitions consistent.
 */

export const ORDER_STATUSES = ["pending", "preparing", "ready", "served"];

export const ORDER_STATUS_META = {
  pending: { badge: "badge-warning", color: "var(--warning-600)", next: "preparing" },
  preparing: { badge: "badge-info", color: "var(--info-600)", next: "ready" },
  ready: { badge: "badge-success", color: "var(--success-600)", next: "served" },
  served: { badge: "badge-gray", color: "var(--gray-500)", next: null },
  cancelled: { badge: "badge-danger", color: "var(--danger-600)", next: null },
};

export const SESSION_STATUSES = [
  "opened",
  "ordering",
  "preparing",
  "ready",
  "served",
  "bill_requested",
  "payment_pending",
  "paid",
  "closed",
];

export const SESSION_STATUS_META = {
  opened: { badge: "badge-brand" },
  ordering: { badge: "badge-brand" },
  preparing: { badge: "badge-info" },
  ready: { badge: "badge-success" },
  served: { badge: "badge-gray" },
  bill_requested: { badge: "badge-purple" },
  payment_pending: { badge: "badge-warning" },
  paid: { badge: "badge-success" },
  closed: { badge: "badge-gray" },
};

export const TABLE_STATUS_META = {
  available: { badge: "badge-success" },
  occupied: { badge: "badge-warning" },
  reserved: { badge: "badge-info" },
  inactive: { badge: "badge-gray" },
};

/** Orders older than this (minutes) are flagged as late on the kitchen board. */
export const LATE_ORDER_MINUTES = 15;

/** Polling intervals (ms) — the MVP uses polling instead of WebSockets. */
export const POLL_INTERVAL = {
  kitchen: 4000,
  adminOrders: 8000,
  sessions: 10000,
  customerOrders: 5000,
  dashboard: 15000,
};
