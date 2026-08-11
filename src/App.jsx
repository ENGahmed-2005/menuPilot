import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./layouts/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import DashboardPage from "./pages/admin/DashboardPage";
import TablesPage from "./pages/admin/TablesPage";
import MenuPage from "./pages/admin/MenuPage";
import OrdersPage from "./pages/admin/OrdersPage";
import SessionsPage from "./pages/admin/SessionsPage";
import SettingsPage from "./pages/admin/SettingsPage";

import KitchenPage from "./pages/kitchen/KitchenPage";

import SessionStartPage from "./pages/customer/SessionStartPage";
import CustomerSessionPage from "./pages/customer/CustomerSessionPage";

import NotFoundPage from "./pages/NotFoundPage";

/**
 * menuPilot route map.
 *
 *  /                  landing
 *  /login /register   owner auth              (FR-01, FR-02)
 *  /admin/*           owner dashboard         (FR-04..FR-10, FR-21, FR-28..FR-32)
 *  /kitchen           live kitchen board      (FR-18, FR-19)
 *  /t/:qrToken        QR entry point          (FR-11, FR-24, FR-26)
 *  /s/:sessionCode    customer session app    (FR-12..FR-17, FR-20, FR-27)
 */
export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="sessions" element={<SessionsPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route
                  path="/kitchen"
                  element={
                    <ProtectedRoute>
                      <KitchenPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="/t/:qrToken" element={<SessionStartPage />} />
                <Route path="/s/:sessionCode" element={<CustomerSessionPage />} />

                <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
