import { createContext, useContext } from "react";

/**
 * Context objects + their consumer hooks live here (plain .js) so the
 * provider components stay in files that export components only.
 */

export const AuthContext = createContext(null);
export const CartContext = createContext(null);
export const ToastContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
