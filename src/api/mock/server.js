/**
 * In-memory mock backend for menuPilot.
 *
 * It is installed as an axios adapter (see `install()`), so every call in
 * `src/api/services.js` keeps its real shape — swapping to the Laravel API is
 * just a matter of setting `VITE_API_URL` and `VITE_USE_MOCK=false`.
 *
 * State is persisted to localStorage so a refresh (or the kitchen screen in a
 * second tab) sees the same data.
 */

const DB_KEY = "menupilot.mockdb";
const LATENCY = 260;

/* -------------------------------------------------------------------------- */
/* Seed                                                                       */
/* -------------------------------------------------------------------------- */

function seed() {
  const now = Date.now();
  return {
    restaurant: {
      id: 1,
      name: "مطعم الأصالة",
      nameEn: "Al-Asalah Restaurant",
      logoUrl: "",
      address: "شارع الملك فهد، الرياض",
      contactPhone: "0112345678",
      currency: "SAR",
      taxRate: 15,
      serviceCharge: 0,
      defaultLanguage: "ar",
    },
    users: [
      {
        id: 1,
        restaurantId: 1,
        name: "أحمد المالك",
        email: "owner@menupilot.app",
        password: "password123",
        role: "owner",
      },
    ],
    branches: [{ id: 1, restaurantId: 1, name: "الفرع الرئيسي", nameEn: "Main branch" }],
    tables: [
      { id: 1, restaurantId: 1, branchId: 1, number: "1", label: "بجانب النافذة", labelEn: "Window side", capacity: 4, status: "available", qrToken: "tbl-a1b2c3", isActive: true },
      { id: 2, restaurantId: 1, branchId: 1, number: "2", label: "", labelEn: "", capacity: 2, status: "available", qrToken: "tbl-d4e5f6", isActive: true },
      { id: 3, restaurantId: 1, branchId: 1, number: "3", label: "تراس خارجي", labelEn: "Outdoor terrace", capacity: 6, status: "available", qrToken: "tbl-g7h8i9", isActive: true },
      { id: 4, restaurantId: 1, branchId: 1, number: "4", label: "", labelEn: "", capacity: 4, status: "available", qrToken: "tbl-j1k2l3", isActive: true },
      { id: 5, restaurantId: 1, branchId: 1, number: "5", label: "عائلات", labelEn: "Family section", capacity: 8, status: "available", qrToken: "tbl-m4n5o6", isActive: true },
      { id: 6, restaurantId: 1, branchId: 1, number: "6", label: "", labelEn: "", capacity: 2, status: "available", qrToken: "tbl-p7q8r9", isActive: true },
    ],
    categories: [
      { id: 1, restaurantId: 1, name: "المقبلات", nameEn: "Appetizers", sortOrder: 1 },
      { id: 2, restaurantId: 1, name: "الأطباق الرئيسية", nameEn: "Main dishes", sortOrder: 2 },
      { id: 3, restaurantId: 1, name: "المشروبات", nameEn: "Drinks", sortOrder: 3 },
      { id: 4, restaurantId: 1, name: "الحلويات", nameEn: "Desserts", sortOrder: 4 },
    ],
    items: [
      { id: 1, restaurantId: 1, categoryId: 1, name: "حمص بالطحينة", nameEn: "Hummus", description: "حمص كريمي مع زيت الزيتون والصنوبر", descriptionEn: "Creamy hummus with olive oil and pine nuts", price: 18, imageUrl: "", isAvailable: true, prepTime: 5 },
      { id: 2, restaurantId: 1, categoryId: 1, name: "فتوش", nameEn: "Fattoush", description: "سلطة خضار طازجة مع خبز محمّص ودبس الرمان", descriptionEn: "Fresh salad with toasted bread and pomegranate molasses", price: 22, imageUrl: "", isAvailable: true, prepTime: 7 },
      { id: 3, restaurantId: 1, categoryId: 1, name: "سمبوسة لحم", nameEn: "Meat samosa", description: "٥ قطع محشوة لحم مفروم متبّل", descriptionEn: "5 pieces filled with seasoned minced meat", price: 15, imageUrl: "", isAvailable: true, prepTime: 8 },
      { id: 4, restaurantId: 1, categoryId: 2, name: "مندي لحم", nameEn: "Lamb mandi", description: "أرز بسمتي مع لحم غنم مدخّن", descriptionEn: "Basmati rice with smoked lamb", price: 68, imageUrl: "", isAvailable: true, prepTime: 25 },
      { id: 5, restaurantId: 1, categoryId: 2, name: "دجاج مشوي", nameEn: "Grilled chicken", description: "نصف دجاجة مشوية مع صلصة الثوم والبطاطس", descriptionEn: "Half grilled chicken with garlic sauce and fries", price: 45, imageUrl: "", isAvailable: true, prepTime: 20 },
      { id: 6, restaurantId: 1, categoryId: 2, name: "برجر لحم أنجوس", nameEn: "Angus beef burger", description: "برجر لحم أنجوس مع جبنة شيدر وصلصة خاصة", descriptionEn: "Angus beef patty with cheddar and house sauce", price: 39, imageUrl: "", isAvailable: true, prepTime: 15 },
      { id: 7, restaurantId: 1, categoryId: 2, name: "باستا ألفريدو", nameEn: "Alfredo pasta", description: "فيتوتشيني بصلصة الكريمة والدجاج", descriptionEn: "Fettuccine in cream sauce with chicken", price: 42, imageUrl: "", isAvailable: false, prepTime: 18 },
      { id: 8, restaurantId: 1, categoryId: 3, name: "عصير برتقال طازج", nameEn: "Fresh orange juice", description: "معصور طازجًا", descriptionEn: "Freshly squeezed", price: 16, imageUrl: "", isAvailable: true, prepTime: 3 },
      { id: 9, restaurantId: 1, categoryId: 3, name: "قهوة عربية", nameEn: "Arabic coffee", description: "تُقدَّم مع التمر", descriptionEn: "Served with dates", price: 12, imageUrl: "", isAvailable: true, prepTime: 4 },
      { id: 10, restaurantId: 1, categoryId: 3, name: "ماء معدني", nameEn: "Mineral water", description: "٦٠٠ مل", descriptionEn: "600 ml", price: 5, imageUrl: "", isAvailable: true, prepTime: 1 },
      { id: 11, restaurantId: 1, categoryId: 4, name: "كنافة نابلسية", nameEn: "Kunafa", description: "كنافة بالجبن مع القطر", descriptionEn: "Cheese kunafa with syrup", price: 28, imageUrl: "", isAvailable: true, prepTime: 12 },
      { id: 12, restaurantId: 1, categoryId: 4, name: "تشيز كيك", nameEn: "Cheesecake", description: "قطعة تشيز كيك بالتوت", descriptionEn: "Berry cheesecake slice", price: 26, imageUrl: "", isAvailable: true, prepTime: 5 },
    ],
    sessions: [],
    orders: [],
    counters: { table: 7, category: 5, item: 13, session: 1, order: 1, orderNumber: 1000, user: 2 },
    seededAt: now,
  };
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to seed */
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* quota / private mode */
  }
}

let db = null;

function getDb() {
  if (!db) db = load();
  return db;
}

function commit() {
  save(db);
  // Let other tabs (e.g. the kitchen display) pick up changes.
  try {
    localStorage.setItem("menupilot.mockping", String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function resetMockDb() {
  db = seed();
  save(db);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const nowIso = () => new Date().toISOString();
const nextId = (key) => getDb().counters[key]++;
const randomToken = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`;

function fail(status, message, errors = null) {
  const err = new Error(message);
  err.__mock = { status, message, errors };
  throw err;
}

function requireAuth(headers) {
  const auth = headers?.Authorization || headers?.authorization;
  if (!auth || !String(auth).startsWith("Bearer mock-token-")) {
    fail(401, "Unauthenticated.");
  }
  const userId = Number(String(auth).replace("Bearer mock-token-", ""));
  const user = getDb().users.find((u) => u.id === userId);
  if (!user) fail(401, "Unauthenticated.");
  return user;
}

/** Multi-tenant scoping (FR-22): every read is filtered by the caller's restaurant. */
function scoped(collection, restaurantId) {
  return getDb()[collection].filter((r) => r.restaurantId === restaurantId);
}

function publicItem(item) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    nameEn: item.nameEn,
    description: item.description,
    descriptionEn: item.descriptionEn,
    price: item.price,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    prepTime: item.prepTime,
  };
}

function orderTotal(order) {
  return order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function billFor(session) {
  const orders = getDb().orders.filter(
    (o) => o.sessionId === session.id && o.status !== "cancelled"
  );
  const subtotal = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const settings = getDb().restaurant;
  const tax = Math.round(subtotal * (settings.taxRate / 100) * 100) / 100;
  const service = Math.round(subtotal * (settings.serviceCharge / 100) * 100) / 100;
  return {
    subtotal,
    tax,
    taxRate: settings.taxRate,
    service,
    serviceRate: settings.serviceCharge,
    total: Math.round((subtotal + tax + service) * 100) / 100,
    orders,
  };
}

function hydrateSession(session) {
  const table = getDb().tables.find((t) => t.id === session.tableId);
  const bill = billFor(session);
  return {
    ...session,
    table: table ? { id: table.id, number: table.number, label: table.label } : null,
    qrToken: table?.qrToken ?? null,
    restaurant: {
      name: getDb().restaurant.name,
      nameEn: getDb().restaurant.nameEn,
      logoUrl: getDb().restaurant.logoUrl,
      currency: getDb().restaurant.currency,
    },
    ordersCount: bill.orders.length,
    bill: {
      subtotal: bill.subtotal,
      tax: bill.tax,
      taxRate: bill.taxRate,
      service: bill.service,
      serviceRate: bill.serviceRate,
      total: bill.total,
    },
  };
}

function hydrateOrder(order) {
  const session = getDb().sessions.find((s) => s.id === order.sessionId);
  const table = getDb().tables.find((t) => t.id === order.tableId);
  return {
    ...order,
    total: orderTotal(order),
    tableNumber: table?.number ?? null,
    customerName: session?.customerName ?? null,
    customerPhone: session?.customerPhone ?? null,
    sessionCode: session?.code ?? null,
  };
}

/** Session lifecycle derived from its orders (1.10.1). */
function recomputeSessionStatus(session) {
  if (["bill_requested", "payment_pending", "paid", "closed"].includes(session.status)) return;
  const orders = getDb().orders.filter(
    (o) => o.sessionId === session.id && o.status !== "cancelled"
  );
  if (orders.length === 0) {
    session.status = "opened";
    return;
  }
  if (orders.every((o) => o.status === "served")) session.status = "served";
  else if (orders.some((o) => o.status === "ready")) session.status = "ready";
  else if (orders.some((o) => o.status === "preparing")) session.status = "preparing";
  else session.status = "ordering";
}

/* -------------------------------------------------------------------------- */
/* Route table                                                                */
/* -------------------------------------------------------------------------- */

const routes = [
  /* ---------------------------- Auth ---------------------------- */
  {
    method: "post",
    path: /^\/auth\/register$/,
    handler: ({ body }) => {
      const errors = {};
      if (!body.email) errors.email = ["The email field is required."];
      if (!body.password || body.password.length < 8)
        errors.password = ["The password must be at least 8 characters."];
      if (!body.restaurantName) errors.restaurantName = ["The restaurant name field is required."];
      if (getDb().users.some((u) => u.email === body.email))
        errors.email = ["This email is already registered."];
      if (Object.keys(errors).length) fail(422, "The given data was invalid.", errors);

      const restaurantId = 1; // single-tenant mock
      const user = {
        id: nextId("user"),
        restaurantId,
        name: body.ownerName || body.restaurantName,
        email: body.email,
        password: body.password,
        role: "owner",
      };
      getDb().users.push(user);
      getDb().restaurant.name = body.restaurantName;
      commit();
      return {
        token: `mock-token-${user.id}`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        restaurant: getDb().restaurant,
      };
    },
  },
  {
    method: "post",
    path: /^\/auth\/login$/,
    handler: ({ body }) => {
      const user = getDb().users.find(
        (u) => u.email === body.email && u.password === body.password
      );
      if (!user) fail(401, "invalid_credentials");
      return {
        token: `mock-token-${user.id}`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        restaurant: getDb().restaurant,
      };
    },
  },
  { method: "post", path: /^\/auth\/logout$/, handler: () => ({ ok: true }) },
  {
    method: "get",
    path: /^\/auth\/me$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        restaurant: getDb().restaurant,
      };
    },
  },

  /* --------------------------- Tables --------------------------- */
  {
    method: "get",
    path: /^\/tables$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      return scoped("tables", user.restaurantId).map((t) => {
        const active = getDb().sessions.find(
          (s) => s.tableId === t.id && s.status !== "closed"
        );
        return { ...t, activeSession: active ? hydrateSession(active) : null };
      });
    },
  },
  {
    method: "post",
    path: /^\/tables$/,
    handler: ({ headers, body }) => {
      const user = requireAuth(headers);
      const errors = {};
      if (!body.number) errors.number = ["The table number field is required."];
      else if (
        scoped("tables", user.restaurantId).some((t) => String(t.number) === String(body.number))
      )
        errors.number = ["This table number already exists."];
      if (Object.keys(errors).length) fail(422, "The given data was invalid.", errors);

      const table = {
        id: nextId("table"),
        restaurantId: user.restaurantId,
        branchId: 1,
        number: String(body.number),
        label: body.label || "",
        labelEn: body.labelEn || "",
        capacity: Number(body.capacity) || 4,
        status: "available",
        qrToken: randomToken("tbl"), // FR-07: QR generated on creation
        isActive: body.isActive !== false,
      };
      getDb().tables.push(table);
      commit();
      return table;
    },
  },
  {
    method: "put",
    path: /^\/tables\/(\d+)$/,
    handler: ({ headers, body, params }) => {
      const user = requireAuth(headers);
      const id = Number(params[0]);
      const table = getDb().tables.find((t) => t.id === id && t.restaurantId === user.restaurantId);
      if (!table) fail(404, "Table not found.");
      if (
        body.number &&
        scoped("tables", user.restaurantId).some(
          (t) => t.id !== id && String(t.number) === String(body.number)
        )
      )
        fail(422, "The given data was invalid.", { number: ["This table number already exists."] });

      Object.assign(table, {
        number: body.number !== undefined ? String(body.number) : table.number,
        label: body.label ?? table.label,
        labelEn: body.labelEn ?? table.labelEn,
        capacity: body.capacity !== undefined ? Number(body.capacity) : table.capacity,
        isActive: body.isActive !== undefined ? body.isActive : table.isActive,
      });
      commit();
      return table;
    },
  },
  {
    method: "delete",
    path: /^\/tables\/(\d+)$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const id = Number(params[0]);
      const idx = getDb().tables.findIndex(
        (t) => t.id === id && t.restaurantId === user.restaurantId
      );
      if (idx === -1) fail(404, "Table not found.");
      const hasActive = getDb().sessions.some((s) => s.tableId === id && s.status !== "closed");
      if (hasActive) fail(409, "table_has_active_session");
      getDb().tables.splice(idx, 1);
      commit();
      return { ok: true };
    },
  },

  /* ---------------------------- Menu ---------------------------- */
  {
    method: "get",
    path: /^\/menu\/categories$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      return scoped("categories", user.restaurantId).sort((a, b) => a.sortOrder - b.sortOrder);
    },
  },
  {
    method: "post",
    path: /^\/menu\/categories$/,
    handler: ({ headers, body }) => {
      const user = requireAuth(headers);
      if (!body.name) fail(422, "The given data was invalid.", { name: ["The name field is required."] });
      const cat = {
        id: nextId("category"),
        restaurantId: user.restaurantId,
        name: body.name,
        nameEn: body.nameEn || "",
        sortOrder: scoped("categories", user.restaurantId).length + 1,
      };
      getDb().categories.push(cat);
      commit();
      return cat;
    },
  },
  {
    method: "put",
    path: /^\/menu\/categories\/(\d+)$/,
    handler: ({ headers, body, params }) => {
      const user = requireAuth(headers);
      const cat = getDb().categories.find(
        (c) => c.id === Number(params[0]) && c.restaurantId === user.restaurantId
      );
      if (!cat) fail(404, "Category not found.");
      if (!body.name) fail(422, "The given data was invalid.", { name: ["The name field is required."] });
      cat.name = body.name;
      cat.nameEn = body.nameEn ?? cat.nameEn;
      commit();
      return cat;
    },
  },
  {
    method: "delete",
    path: /^\/menu\/categories\/(\d+)$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const id = Number(params[0]);
      const idx = getDb().categories.findIndex(
        (c) => c.id === id && c.restaurantId === user.restaurantId
      );
      if (idx === -1) fail(404, "Category not found.");
      getDb().categories.splice(idx, 1);
      getDb()
        .items.filter((i) => i.categoryId === id)
        .forEach((i) => {
          i.categoryId = null;
        });
      commit();
      return { ok: true };
    },
  },
  {
    method: "get",
    path: /^\/menu\/items$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      return scoped("items", user.restaurantId);
    },
  },
  {
    method: "post",
    path: /^\/menu\/items$/,
    handler: ({ headers, body }) => {
      const user = requireAuth(headers);
      const errors = {};
      if (!body.name) errors.name = ["The name field is required."];
      if (body.price === "" || body.price === undefined || Number(body.price) <= 0)
        errors.price = ["The price must be greater than 0."];
      if (Object.keys(errors).length) fail(422, "The given data was invalid.", errors);

      const item = {
        id: nextId("item"),
        restaurantId: user.restaurantId,
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        name: body.name,
        nameEn: body.nameEn || "",
        description: body.description || "",
        descriptionEn: body.descriptionEn || "",
        price: Number(body.price),
        imageUrl: body.imageUrl || "",
        isAvailable: body.isAvailable !== false,
        prepTime: Number(body.prepTime) || 10,
      };
      getDb().items.push(item);
      commit();
      return item;
    },
  },
  {
    method: "put",
    path: /^\/menu\/items\/(\d+)$/,
    handler: ({ headers, body, params }) => {
      const user = requireAuth(headers);
      const item = getDb().items.find(
        (i) => i.id === Number(params[0]) && i.restaurantId === user.restaurantId
      );
      if (!item) fail(404, "Item not found.");
      if (body.price !== undefined && Number(body.price) <= 0)
        fail(422, "The given data was invalid.", { price: ["The price must be greater than 0."] });

      Object.assign(item, {
        categoryId: body.categoryId !== undefined
          ? body.categoryId ? Number(body.categoryId) : null
          : item.categoryId,
        name: body.name ?? item.name,
        nameEn: body.nameEn ?? item.nameEn,
        description: body.description ?? item.description,
        descriptionEn: body.descriptionEn ?? item.descriptionEn,
        price: body.price !== undefined ? Number(body.price) : item.price,
        imageUrl: body.imageUrl ?? item.imageUrl,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : item.isAvailable,
        prepTime: body.prepTime !== undefined ? Number(body.prepTime) : item.prepTime,
      });
      commit();
      return item;
    },
  },
  {
    method: "delete",
    path: /^\/menu\/items\/(\d+)$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const idx = getDb().items.findIndex(
        (i) => i.id === Number(params[0]) && i.restaurantId === user.restaurantId
      );
      if (idx === -1) fail(404, "Item not found.");
      getDb().items.splice(idx, 1);
      commit();
      return { ok: true };
    },
  },

  /* --------------------------- Orders --------------------------- */
  {
    method: "get",
    path: /^\/orders$/,
    handler: ({ headers, query }) => {
      const user = requireAuth(headers);
      let list = getDb()
        .orders.filter((o) => o.restaurantId === user.restaurantId)
        .map(hydrateOrder)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (query.scope === "current") {
        list = list.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
      } else if (query.scope === "history") {
        list = list.filter((o) => ["served", "cancelled"].includes(o.status));
      }
      if (query.status) list = list.filter((o) => o.status === query.status);
      return list;
    },
  },
  {
    method: "get",
    path: /^\/orders\/(\d+)$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const order = getDb().orders.find(
        (o) => o.id === Number(params[0]) && o.restaurantId === user.restaurantId
      );
      if (!order) fail(404, "Order not found.");
      return hydrateOrder(order);
    },
  },
  {
    method: "patch",
    path: /^\/orders\/(\d+)\/status$/,
    handler: ({ headers, body, params }) => {
      const user = requireAuth(headers);
      const order = getDb().orders.find(
        (o) => o.id === Number(params[0]) && o.restaurantId === user.restaurantId
      );
      if (!order) fail(404, "Order not found.");
      const allowed = ["pending", "preparing", "ready", "served", "cancelled"];
      if (!allowed.includes(body.status)) fail(422, "Invalid status.");

      order.status = body.status;
      order.updatedAt = nowIso();
      order.timeline.push({ status: body.status, at: nowIso() }); // FR-23

      const session = getDb().sessions.find((s) => s.id === order.sessionId);
      if (session) recomputeSessionStatus(session);
      commit();
      return hydrateOrder(order);
    },
  },
  {
    method: "get",
    path: /^\/kitchen\/orders$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      return getDb()
        .orders.filter(
          (o) =>
            o.restaurantId === user.restaurantId &&
            ["pending", "preparing", "ready"].includes(o.status)
        )
        .map(hydrateOrder)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
  },

  /* -------------------------- Sessions -------------------------- */
  {
    method: "get",
    path: /^\/sessions$/,
    handler: ({ headers, query }) => {
      const user = requireAuth(headers);
      let list = getDb()
        .sessions.filter((s) => s.restaurantId === user.restaurantId)
        .map(hydrateSession)
        .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
      if (query.scope === "active") list = list.filter((s) => s.status !== "closed");
      else if (query.scope === "closed") list = list.filter((s) => s.status === "closed");
      return list;
    },
  },
  {
    method: "get",
    path: /^\/sessions\/(\d+)$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const session = getDb().sessions.find(
        (s) => s.id === Number(params[0]) && s.restaurantId === user.restaurantId
      );
      if (!session) fail(404, "Session not found.");
      const bill = billFor(session);
      return { ...hydrateSession(session), orders: bill.orders.map(hydrateOrder) };
    },
  },
  {
    method: "post",
    path: /^\/sessions$/,
    handler: ({ headers, body }) => {
      const user = requireAuth(headers);
      const table = getDb().tables.find(
        (t) => t.id === Number(body.tableId) && t.restaurantId === user.restaurantId
      );
      if (!table) fail(404, "Table not found.");
      // FR-26 / NFR-09: only one active session per table.
      if (getDb().sessions.some((s) => s.tableId === table.id && s.status !== "closed"))
        fail(409, "table_has_active_session");

      const session = createSession(table, body.customerName, body.customerPhone);
      commit();
      return hydrateSession(session);
    },
  },
  {
    method: "post",
    path: /^\/sessions\/(\d+)\/payment$/,
    handler: ({ headers, body, params }) => {
      const user = requireAuth(headers);
      const session = getDb().sessions.find(
        (s) => s.id === Number(params[0]) && s.restaurantId === user.restaurantId
      );
      if (!session) fail(404, "Session not found.");
      if (session.status === "closed") fail(409, "session_already_closed");
      if (!["cash", "card"].includes(body.method))
        fail(422, "The given data was invalid.", { method: ["Invalid payment method."] });

      const bill = billFor(session);
      session.payment = {
        method: body.method, // FR-30
        amount: bill.total,
        received: body.received !== undefined ? Number(body.received) : bill.total,
        at: nowIso(),
        by: user.name,
      };
      session.status = "paid";
      session.timeline.push({ status: "paid", at: nowIso() });
      commit();
      return hydrateSession(session);
    },
  },
  {
    method: "post",
    path: /^\/sessions\/(\d+)\/close$/,
    handler: ({ headers, params }) => {
      const user = requireAuth(headers);
      const session = getDb().sessions.find(
        (s) => s.id === Number(params[0]) && s.restaurantId === user.restaurantId
      );
      if (!session) fail(404, "Session not found.");
      // FR-31: closing requires a confirmed payment.
      if (!session.payment) fail(409, "payment_required");

      session.status = "closed";
      session.closedAt = nowIso();
      session.timeline.push({ status: "closed", at: nowIso() });

      const table = getDb().tables.find((t) => t.id === session.tableId);
      if (table) table.status = "available"; // FR-32
      commit();
      return hydrateSession(session);
    },
  },

  /* --------------------------- Public --------------------------- */
  {
    method: "get",
    path: /^\/public\/qr\/([^/]+)$/,
    handler: ({ params }) => {
      const table = getDb().tables.find((t) => t.qrToken === params[0]);
      if (!table) fail(404, "invalid_qr");
      const active = getDb().sessions.find((s) => s.tableId === table.id && s.status !== "closed");
      return {
        restaurant: {
          name: getDb().restaurant.name,
          nameEn: getDb().restaurant.nameEn,
          logoUrl: getDb().restaurant.logoUrl,
          currency: getDb().restaurant.currency,
        },
        table: { id: table.id, number: table.number, label: table.label, labelEn: table.labelEn },
        activeSession: active
          ? { code: active.code, customerName: active.customerName, status: active.status }
          : null,
      };
    },
  },
  {
    method: "post",
    path: /^\/public\/qr\/([^/]+)\/session$/,
    handler: ({ params, body }) => {
      const table = getDb().tables.find((t) => t.qrToken === params[0]);
      if (!table) fail(404, "invalid_qr");

      const errors = {};
      if (!body.customerName?.trim()) errors.customerName = ["The name field is required."];
      if (!/^[0-9+\-\s()]{9,15}$/.test(String(body.customerPhone || "").trim()))
        errors.customerPhone = ["Enter a valid phone number."];
      if (Object.keys(errors).length) fail(422, "The given data was invalid.", errors);

      const existing = getDb().sessions.find(
        (s) => s.tableId === table.id && s.status !== "closed"
      );
      if (existing) fail(409, "table_has_active_session"); // FR-26

      const session = createSession(table, body.customerName.trim(), body.customerPhone.trim());
      commit();
      return {
        sessionToken: `mock-session-${session.code}`,
        session: hydrateSession(session),
      };
    },
  },
  {
    method: "get",
    path: /^\/public\/qr\/([^/]+)\/menu$/,
    handler: ({ params }) => {
      const table = getDb().tables.find((t) => t.qrToken === params[0]);
      if (!table) fail(404, "invalid_qr");
      // FR-11: menu scoped to the table's restaurant only.
      return {
        categories: getDb()
          .categories.filter((c) => c.restaurantId === table.restaurantId)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        items: getDb()
          .items.filter((i) => i.restaurantId === table.restaurantId)
          .map(publicItem),
      };
    },
  },
  {
    method: "get",
    path: /^\/public\/sessions\/([^/]+)$/,
    handler: ({ params }) => {
      const session = getDb().sessions.find((s) => s.code === params[0]);
      if (!session) fail(404, "session_not_found");
      return hydrateSession(session);
    },
  },
  {
    method: "post",
    path: /^\/public\/sessions\/([^/]+)\/orders$/,
    handler: ({ params, body }) => {
      const session = getDb().sessions.find((s) => s.code === params[0]);
      if (!session) fail(404, "session_not_found");
      if (session.status === "closed") fail(409, "session_closed");
      if (!Array.isArray(body.items) || body.items.length === 0)
        fail(422, "The given data was invalid.", { items: ["Cart is empty."] });

      const orderItems = body.items.map((line) => {
        const item = getDb().items.find((i) => i.id === Number(line.itemId));
        if (!item) fail(422, "Unknown menu item.");
        if (!item.isAvailable) fail(409, "item_unavailable");
        return {
          itemId: item.id,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          quantity: Math.max(1, Number(line.quantity) || 1),
          note: (line.note || "").slice(0, 240), // FR-14
        };
      });

      const order = {
        id: nextId("order"),
        restaurantId: session.restaurantId,
        sessionId: session.id,
        tableId: session.tableId,
        number: nextId("orderNumber"), // FR-17
        status: "pending",
        items: orderItems,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        timeline: [{ status: "pending", at: nowIso() }],
      };
      getDb().orders.push(order);
      recomputeSessionStatus(session);
      commit();
      return hydrateOrder(order);
    },
  },
  {
    method: "get",
    path: /^\/public\/sessions\/([^/]+)\/orders$/,
    handler: ({ params }) => {
      const session = getDb().sessions.find((s) => s.code === params[0]);
      if (!session) fail(404, "session_not_found");
      return getDb()
        .orders.filter((o) => o.sessionId === session.id)
        .map(hydrateOrder)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  {
    method: "get",
    path: /^\/public\/sessions\/([^/]+)\/bill$/,
    handler: ({ params }) => {
      const session = getDb().sessions.find((s) => s.code === params[0]);
      if (!session) fail(404, "session_not_found");
      const bill = billFor(session);
      return {
        ...bill,
        orders: bill.orders.map(hydrateOrder),
        status: session.status,
        billRequestedAt: session.billRequestedAt,
        payment: session.payment,
      };
    },
  },
  {
    method: "post",
    path: /^\/public\/sessions\/([^/]+)\/bill-request$/,
    handler: ({ params }) => {
      const session = getDb().sessions.find((s) => s.code === params[0]);
      if (!session) fail(404, "session_not_found");
      if (session.status === "closed") fail(409, "session_closed");
      // FR-27 / FR-28
      session.billRequestedAt = nowIso();
      if (!["paid", "payment_pending"].includes(session.status)) {
        session.status = "bill_requested";
        session.timeline.push({ status: "bill_requested", at: nowIso() });
      }
      commit();
      return hydrateSession(session);
    },
  },

  /* ------------------------- Dashboard -------------------------- */
  {
    method: "get",
    path: /^\/dashboard\/stats$/,
    handler: ({ headers }) => {
      const user = requireAuth(headers);
      const rid = user.restaurantId;
      const today = new Date().toDateString();
      const orders = getDb().orders.filter((o) => o.restaurantId === rid);
      const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
      const sessions = getDb().sessions.filter((s) => s.restaurantId === rid);
      const tables = scoped("tables", rid);
      const activeSessions = sessions.filter((s) => s.status !== "closed");

      const served = orders.filter((o) => o.status === "served" && o.timeline.length > 1);
      const avgPrep =
        served.length === 0
          ? 0
          : Math.round(
              served.reduce((sum, o) => {
                const start = new Date(o.timeline[0].at);
                const end = new Date(o.timeline[o.timeline.length - 1].at);
                return sum + (end - start) / 60000;
              }, 0) / served.length
            );

      return {
        activeSessions: activeSessions.length,
        activeOrders: orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status))
          .length,
        todayOrders: todayOrders.length,
        todayRevenue: sessions
          .filter((s) => s.payment && new Date(s.payment.at).toDateString() === today)
          .reduce((sum, s) => sum + s.payment.amount, 0),
        availableTables: tables.filter(
          (t) => !activeSessions.some((s) => s.tableId === t.id)
        ).length,
        occupiedTables: activeSessions.length,
        totalTables: tables.length,
        avgPrepTime: avgPrep,
        pendingBills: sessions.filter((s) =>
          ["bill_requested", "payment_pending"].includes(s.status)
        ).length,
        recentOrders: orders
          .map(hydrateOrder)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6),
      };
    },
  },

  /* -------------------------- Settings -------------------------- */
  {
    method: "get",
    path: /^\/settings$/,
    handler: ({ headers }) => {
      requireAuth(headers);
      return getDb().restaurant;
    },
  },
  {
    method: "put",
    path: /^\/settings$/,
    handler: ({ headers, body }) => {
      requireAuth(headers);
      Object.assign(getDb().restaurant, {
        name: body.name ?? getDb().restaurant.name,
        nameEn: body.nameEn ?? getDb().restaurant.nameEn,
        logoUrl: body.logoUrl ?? getDb().restaurant.logoUrl,
        address: body.address ?? getDb().restaurant.address,
        contactPhone: body.contactPhone ?? getDb().restaurant.contactPhone,
        currency: body.currency ?? getDb().restaurant.currency,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : getDb().restaurant.taxRate,
        serviceCharge:
          body.serviceCharge !== undefined
            ? Number(body.serviceCharge)
            : getDb().restaurant.serviceCharge,
        defaultLanguage: body.defaultLanguage ?? getDb().restaurant.defaultLanguage,
      });
      commit();
      return getDb().restaurant;
    },
  },
];

function createSession(table, customerName, customerPhone) {
  const session = {
    id: nextId("session"),
    restaurantId: table.restaurantId,
    tableId: table.id,
    code: randomToken("ses"),
    customerName: customerName || "",
    customerPhone: customerPhone || "",
    status: "opened",
    openedAt: nowIso(),
    closedAt: null,
    billRequestedAt: null,
    payment: null,
    timeline: [{ status: "opened", at: nowIso() }],
  };
  getDb().sessions.push(session);
  table.status = "occupied";
  return session;
}

/* -------------------------------------------------------------------------- */
/* Axios adapter                                                              */
/* -------------------------------------------------------------------------- */

function parsePath(url, baseURL) {
  let path = url || "";
  if (baseURL && path.startsWith(baseURL)) path = path.slice(baseURL.length);
  path = path.replace(/^https?:\/\/[^/]+/, "");
  const [pathname] = path.split("?");
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function mockAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const pathname = parsePath(config.url, config.baseURL);
  const query = config.params || {};
  let body = config.data;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const route = routes.find((r) => r.method === method && r.path.test(pathname));

      if (!route) {
        reject(
          Object.assign(new Error(`Mock route not found: ${method.toUpperCase()} ${pathname}`), {
            config,
            response: {
              status: 404,
              data: { message: `Mock route not found: ${method.toUpperCase()} ${pathname}` },
              config,
              headers: {},
            },
          })
        );
        return;
      }

      try {
        const params = route.path.exec(pathname).slice(1);
        const data = route.handler({ headers: config.headers || {}, body, query, params });
        resolve({ data: { data }, status: 200, statusText: "OK", headers: {}, config });
      } catch (err) {
        const info = err.__mock || { status: 500, message: err.message, errors: null };
        reject(
          Object.assign(new Error(info.message), {
            config,
            response: {
              status: info.status,
              data: { message: info.message, errors: info.errors },
              config,
              headers: {},
            },
          })
        );
      }
    }, LATENCY);
  });
}

/** Installs the mock adapter on the given axios instance. */
export function installMock(instance) {
  instance.defaults.adapter = mockAdapter;
  if (typeof window !== "undefined") {
    window.__menupilotMock = { reset: resetMockDb, db: getDb };
  }
}

export default installMock;
