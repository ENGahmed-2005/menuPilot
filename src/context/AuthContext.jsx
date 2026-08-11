import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/services";
import { getToken, setToken } from "../api/client";
import { AuthContext } from "./contexts";

/**
 * Owner/staff authentication state (FR-01, FR-02, FR-03).
 * Restores the session on boot from the stored Sanctum token.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(getToken()));

  const clear = useCallback(() => {
    setUser(null);
    setRestaurant(null);
    setToken(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!getToken()) return;
      try {
        const data = await authApi.me();
        if (!cancelled) {
          setUser(data.user);
          setRestaurant(data.restaurant);
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    boot();

    // The axios interceptor emits this when a 401 invalidates the token.
    const onUnauthorized = () => clear();
    window.addEventListener("menupilot:unauthorized", onUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener("menupilot:unauthorized", onUnauthorized);
    };
  }, [clear]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    setRestaurant(data.restaurant);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setUser(data.user);
    setRestaurant(data.restaurant);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({
      user,
      restaurant,
      setRestaurant,
      booting,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, restaurant, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
