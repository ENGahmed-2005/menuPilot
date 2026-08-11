import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconAlert, IconCheckCircle, IconClose, IconInfo } from "../components/ui/Icons";
import { ToastContext } from "./contexts";

const ICONS = {
  success: IconCheckCircle,
  error: IconAlert,
  warning: IconAlert,
  info: IconInfo,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (msg, d) => push(msg, "success", d),
      error: (msg, d) => push(msg, "error", d ?? 6000),
      info: (msg, d) => push(msg, "info", d),
      warning: (msg, d) => push(msg, "warning", d),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || IconInfo;
            return (
              <div key={t.id} className={`toast toast-${t.type}`}>
                <Icon size={18} />
                <span className="grow">{t.message}</span>
                <button
                  type="button"
                  className="toast-close"
                  onClick={() => dismiss(t.id)}
                  aria-label="close"
                >
                  <IconClose size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
