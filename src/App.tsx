import { Fragment } from 'react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { OrderOnline } from './pages/OrderOnline';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { Restaurant } from './pages/Restaurant';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import { CustomCursor } from './components/CustomCursor';
import { ProtectedRoute } from './components/ProtectedRoute';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Fragment key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/order" element={<PageTransition><OrderOnline /></PageTransition>} />
          <Route path="/restaurant" element={<PageTransition><Restaurant /></PageTransition>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Fragment>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </SettingsProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <CustomCursor />
      <div className={`min-h-screen font-sans ${isAdminRoute ? 'bg-[var(--color-sumi)] text-[var(--color-washi)]' : 'bg-[#fdfbf7] text-[#2c2825] selection:bg-[#d4a373] selection:text-white'} flex flex-col`}>
        {!isAdminRoute && <Navbar />}
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
}
