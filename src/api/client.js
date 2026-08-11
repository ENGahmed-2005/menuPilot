import axios from "axios";

/**
 * Axios instance for the Laravel backend.
 *
 * Configure the base URL in `.env`:
 *   VITE_API_URL=http://localhost:8000/api
 *
 * Auth uses Laravel Sanctum bearer tokens. The owner/staff token is kept in
 * localStorage; the anonymous customer session token is kept separately so a
 * customer device never carries staff credentials.
 */

export const TOKEN_KEY = "menupilot.token";
export const SESSION_TOKEN_KEY = "menupilot.sessionToken";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function getSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/* Attach auth + locale headers on every request. */
api.interceptors.request.use((config) => {
  const token = getToken();
  const sessionToken = getSessionToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sessionToken) {
    // Customer dining-session identity (FR-16, FR-25).
    config.headers["X-Session-Token"] = sessionToken;
  }
  try {
    config.headers["Accept-Language"] = localStorage.getItem("menupilot.lang") || "ar";
  } catch {
    /* ignore */
  }
  return config;
});

/* Normalize errors into a predictable shape for the UI. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const normalized = {
      status: status ?? 0,
      message: data?.message || error.message,
      /** Laravel validation errors: { field: ["msg"] } */
      errors: data?.errors || null,
      isNetwork: !error.response,
      raw: error,
    };

    if (status === 401 && getToken()) {
      setToken(null);
      window.dispatchEvent(new CustomEvent("menupilot:unauthorized"));
    }

    return Promise.reject(normalized);
  }
);

/** Unwraps Laravel API resources: `{ data: ... }` or a bare payload. */
export function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
}

export default api;
