import { useState, useEffect, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CalendarCheck, UtensilsCrossed, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Only show on Home page
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!isHomePage || isDismissed) return;

    const handleScroll = () => {
      // Show after scrolling past 80vh (past the hero section)
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, isDismissed]);

  const handleDismiss = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isHomePage || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="fixed bottom-6 right-4 z-50 flex items-end gap-2 sm:right-6"
          id="floating-cta-actions"
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-[var(--color-sumi)]/80 backdrop-blur-sm text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>

          <div className="flex flex-col items-stretch gap-2">
            <Link
              to="/order"
              className="group flex items-center justify-center gap-3 px-5 py-3.5 bg-[var(--color-sumi)] text-[var(--color-washi)] shadow-[0_8px_30px_rgba(44,40,37,0.25)] hover:bg-[var(--color-shu)] hover:shadow-[0_12px_40px_rgba(194,59,34,0.35)] transition-all hover:scale-105 sm:px-6 sm:py-4"
            >
              <UtensilsCrossed size={18} className="shrink-0" />
              <span className="text-[11px] tracking-[0.2em] uppercase font-black whitespace-nowrap sm:text-xs">
                {t("nav.orderNow")}
              </span>
            </Link>

            <Link
              to="/reservations"
              className="group flex items-center justify-center gap-3 px-5 py-3.5 bg-[var(--color-shu)] text-[var(--color-washi)] shadow-[0_8px_30px_rgba(194,59,34,0.4)] hover:shadow-[0_12px_40px_rgba(194,59,34,0.5)] transition-all hover:scale-105 sm:px-6 sm:py-4"
            >
              <CalendarCheck size={18} className="shrink-0" />
              <span className="text-[11px] tracking-[0.2em] uppercase font-black whitespace-nowrap sm:text-xs">
                {t("reservations.tag")}
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
