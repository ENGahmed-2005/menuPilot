import api, { unwrap, setToken, setSessionToken } from "./client";

/* ==========================================================================
   Auth — FR-01, FR-02, FR-03
   ========================================================================== */
export const authApi = {
  async register(payload) {
    const res = await api.post("/auth/register", payload);
    const data = unwrap(res);
    if (data?.token) setToken(data.token);
    return data;
  },

  async login(payload) {
    const res = await api.post("/auth/login", payload);
    const data = unwrap(res);
    if (data?.token) setToken(data.token);
    return data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setToken(null);
    }
  },

  async me() {
    const res = await api.get("/auth/me");
    return unwrap(res);
  },
};

/* ==========================================================================
   Tables — FR-04, FR-05, FR-06, FR-07, FR-32
   ========================================================================== */
export const tablesApi = {
  async list(params) {
    const res = await api.get("/tables", { params });
    return unwrap(res);
  },
  async create(payload) {
    const res = await api.post("/tables", payload);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/tables/${id}`, payload);
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/tables/${id}`);
    return unwrap(res);
  },
};

/* ==========================================================================
   Menu — FR-08, FR-09, FR-10
   ========================================================================== */
export const menuApi = {
  async categories() {
    const res = await api.get("/menu/categories");
    return unwrap(res);
  },
  async createCategory(payload) {
    const res = await api.post("/menu/categories", payload);
    return unwrap(res);
  },
  async updateCategory(id, payload) {
    const res = await api.put(`/menu/categories/${id}`, payload);
    return unwrap(res);
  },
  async removeCategory(id) {
    const res = await api.delete(`/menu/categories/${id}`);
    return unwrap(res);
  },

  async items(params) {
    const res = await api.get("/menu/items", { params });
    return unwrap(res);
  },
  async createItem(payload) {
    const res = await api.post("/menu/items", payload);
    return unwrap(res);
  },
  async updateItem(id, payload) {
    const res = await api.put(`/menu/items/${id}`, payload);
    return unwrap(res);
  },
  async removeItem(id) {
    const res = await api.delete(`/menu/items/${id}`);
    return unwrap(res);
  },
};

/* ==========================================================================
   Orders — FR-17..FR-21, FR-23
   ========================================================================== */
export const ordersApi = {
  async list(params) {
    const res = await api.get("/orders", { params });
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/orders/${id}`);
    return unwrap(res);
  },
  /** Kitchen status transition: pending -> preparing -> ready -> served */
  async updateStatus(id, status) {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return unwrap(res);
  },
  /** Kitchen board feed (FR-18). */
  async kitchenQueue() {
    const res = await api.get("/kitchen/orders");
    return unwrap(res);
  },
};

/* ==========================================================================
   Dining sessions — FR-24..FR-32
   ========================================================================== */
export const sessionsApi = {
  async list(params) {
    const res = await api.get("/sessions", { params });
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/sessions/${id}`);
    return unwrap(res);
  },
  /** Staff-side session open for a seated customer. */
  async open(payload) {
    const res = await api.post("/sessions", payload);
    return unwrap(res);
  },
  /** Cashier records payment method + amount (FR-30). */
  async recordPayment(id, payload) {
    const res = await api.post(`/sessions/${id}/payment`, payload);
    return unwrap(res);
  },
  /** Only allowed after payment is confirmed (FR-31, FR-32). */
  async close(id) {
    const res = await api.post(`/sessions/${id}/close`);
    return unwrap(res);
  },
};

/* ==========================================================================
   Public / customer endpoints — no owner auth required
   ========================================================================== */
export const publicApi = {
  /** Resolve a scanned QR token into restaurant + table + active session (FR-11). */
  async resolveQr(qrToken) {
    const res = await api.get(`/public/qr/${qrToken}`);
    return unwrap(res);
  },

  /** Create the dining session after name + phone (FR-24, FR-26). */
  async startSession(qrToken, payload) {
    const res = await api.post(`/public/qr/${qrToken}/session`, payload);
    const data = unwrap(res);
    if (data?.sessionToken) setSessionToken(data.sessionToken);
    return data;
  },

  async menu(qrToken) {
    const res = await api.get(`/public/qr/${qrToken}/menu`);
    return unwrap(res);
  },

  async session(sessionCode) {
    const res = await api.get(`/public/sessions/${sessionCode}`);
    return unwrap(res);
  },

  /** Submit an order inside the active session (FR-16, FR-25). */
  async placeOrder(sessionCode, payload) {
    const res = await api.post(`/public/sessions/${sessionCode}/orders`, payload);
    return unwrap(res);
  },

  /** Customer-side live tracking (FR-20). */
  async orders(sessionCode) {
    const res = await api.get(`/public/sessions/${sessionCode}/orders`);
    return unwrap(res);
  },

  /** Bill total for the whole session (FR-29). */
  async bill(sessionCode) {
    const res = await api.get(`/public/sessions/${sessionCode}/bill`);
    return unwrap(res);
  },

  /** Notify staff that the customer wants the bill (FR-27, FR-28). */
  async requestBill(sessionCode) {
    const res = await api.post(`/public/sessions/${sessionCode}/bill-request`);
    return unwrap(res);
  },

  leaveSession() {
    setSessionToken(null);
  },
};

/* ==========================================================================
   Dashboard + settings
   ========================================================================== */
export const dashboardApi = {
  async stats() {
    const res = await api.get("/dashboard/stats");
    return unwrap(res);
  },
};

export const settingsApi = {
  async get() {
    const res = await api.get("/settings");
    return unwrap(res);
  },
  async update(payload) {
    const res = await api.put("/settings", payload);
    return unwrap(res);
  },
};
