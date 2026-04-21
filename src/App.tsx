import { Fragment } from "react";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { AnimatePresence } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { OrderOnline } from "./pages/OrderOnline";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Cart } from "./pages/Cart";
import { Restaurant } from "./pages/Restaurant";
import { Reservations } from "./pages/Reservations";
import { ReservationManage } from "./pages/ReservationManage";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { Footer } from "./components/Footer";
import { PageTransition } from "./components/PageTransition";
import { CustomCursor } from "./components/CustomCursor";
import { ProtectedRoute } from "./components/ProtectedRoute";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Fragment key={location.pathname}>
        <Routes location={location}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/order"
            element={
              <PageTransition>
                <OrderOnline />
              </PageTransition>
            }
          />
          <Route
            path="/restaurant"
            element={
              <PageTransition>
                <Restaurant />
              </PageTransition>
            }
          />
          <Route
            path="/reservations"
            element={
              <PageTransition>
                <Reservations />
              </PageTransition>
            }
          />
          <Route
            path="/reservations/manage"
            element={
              <PageTransition>
                <ReservationManage />
              </PageTransition>
            }
          />
          <Route
            path="/cart"
            element={
              <PageTransition>
                <Cart />
              </PageTransition>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <PageTransition>
                <PrivacyPolicy />
              </PageTransition>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <PageTransition>
                <TermsOfService />
              </PageTransition>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Fragment>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </SettingsProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <CustomCursor />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-6 focus:py-3 focus:bg-[var(--color-shu)] focus:text-[var(--color-washi)] focus:text-sm focus:font-bold focus:tracking-widest focus:uppercase focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div
        className={`min-h-screen font-sans ${isAdminRoute ? "bg-[var(--color-sumi)] text-[var(--color-washi)]" : "bg-[#fdfbf7] text-[#2c2825] selection:bg-[#d4a373] selection:text-white"} flex flex-col`}
      >
        {!isAdminRoute && <Navbar />}
        <main id="main-content" className="flex-1" role="main">
          <AnimatedRoutes />
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
}
