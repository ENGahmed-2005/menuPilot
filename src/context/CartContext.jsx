import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./contexts";

const storageKey = (sessionCode) => `menupilot.cart.${sessionCode || "anon"}`;
const lineKey = (itemId, note) => `${itemId}::${(note || "").trim()}`;

function readCart(sessionCode) {
  try {
    const raw = localStorage.getItem(storageKey(sessionCode));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Customer cart (FR-12, FR-13, FR-14, FR-15).
 *
 * Lines are keyed by `itemId + note` so the same dish with different notes
 * ("no onions" vs "extra cheese") stays separate, which is what the kitchen
 * needs to see.
 *
 * The provider is remounted per session (via a `key`), so the cart is read
 * once in the state initializer rather than re-synced in an effect.
 */
export function CartProvider({ sessionCode, children }) {
  const [lines, setLines] = useState(() => readCart(sessionCode));

  // Persist to localStorage so a refresh mid-order keeps the cart.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(sessionCode), JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, sessionCode]);

  const addItem = useCallback((item, quantity = 1, note = "") => {
    const key = lineKey(item.id, note);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [
        ...prev,
        {
          key,
          itemId: item.id,
          name: item.name,
          nameEn: item.nameEn,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity,
          note: (note || "").trim(),
        },
      ];
    });
  }, []);

  const updateLine = useCallback((key, patch) => {
    setLines((prev) => {
      const target = prev.find((l) => l.key === key);
      if (!target) return prev;

      const updated = { ...target, ...patch };
      const newKey = lineKey(updated.itemId, updated.note);
      if (newKey === key) return prev.map((l) => (l.key === key ? updated : l));

      // The note changed: re-key, merging into an identical existing line.
      const others = prev.filter((l) => l.key !== key);
      const duplicate = others.find((l) => l.key === newKey);
      if (duplicate) {
        return others.map((l) =>
          l.key === newKey ? { ...l, quantity: l.quantity + updated.quantity } : l
        );
      }
      return [...others, { ...updated, key: newKey }];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity } : l))
    );
  }, []);

  const removeLine = useCallback((key) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { count, subtotal } = useMemo(
    () =>
      lines.reduce(
        (acc, l) => ({
          count: acc.count + l.quantity,
          subtotal: acc.subtotal + l.price * l.quantity,
        }),
        { count: 0, subtotal: 0 }
      ),
    [lines]
  );

  /** Payload shape expected by POST /public/sessions/:code/orders */
  const toOrderPayload = useCallback(
    () => ({
      items: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, note: l.note })),
    }),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      addItem,
      updateLine,
      setQuantity,
      removeLine,
      clear,
      toOrderPayload,
    }),
    [lines, count, subtotal, addItem, updateLine, setQuantity, removeLine, clear, toOrderPayload]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
