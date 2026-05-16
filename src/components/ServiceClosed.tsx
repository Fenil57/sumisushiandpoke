import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";

// ─── Temporary: set to `true` to disable ordering ─────────────────────────
// When Flatpay payment integration is complete, set this to `false`
// (or remove the components entirely).
export const SERVICE_TEMPORARILY_CLOSED = true;
// ───────────────────────────────────────────────────────────────────────────


/**
 * Slim info banner rendered above the navbar.
 * Uses a non-fixed element that occupies document flow so the fixed navbar
 * can offset itself below it via a CSS variable (--banner-h).
 */
export function ServiceClosedBanner() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  // Publish the banner height as a CSS variable so the navbar can offset itself
  useEffect(() => {
    if (!SERVICE_TEMPORARILY_CLOSED || dismissed) {
      document.documentElement.style.setProperty("--banner-h", "0px");
    }
    return () => {
      document.documentElement.style.setProperty("--banner-h", "0px");
    };
  }, [dismissed]);

  if (!SERVICE_TEMPORARILY_CLOSED || dismissed) return null;

  return (
    <>
      {/* Fixed banner — always visible at top */}
      <div
        ref={(el) => {
          if (el) {
            const h = el.getBoundingClientRect().height;
            document.documentElement.style.setProperty("--banner-h", `${h}px`);
          }
        }}
        className="fixed top-0 left-0 right-0 z-[60] w-full bg-[var(--color-sumi)] border-b border-[var(--color-shu)]/30"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center gap-3">
          {/* Icon */}
          <AlertCircle
            size={18}
            className="text-[var(--color-shu)] shrink-0"
            aria-hidden="true"
          />

        {/* Message */}
        <p className="flex-1 text-[11px] sm:text-xs text-[var(--color-washi)]/90 leading-relaxed tracking-wide">
          <span className="font-semibold text-[var(--color-washi)]">
            {t("serviceClosed.bannerTitle")}
          </span>{" "}
          <span className="hidden sm:inline text-[var(--color-washi)]/60">
            —
          </span>{" "}
          <span className="text-[var(--color-washi)]/60">
            {t("serviceClosed.bannerCta")}{" "}
            <a
              href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
              className="text-[var(--color-shu)] font-bold hover:underline underline-offset-2 transition-colors"
            >
              {settings.contactPhone}
            </a>
          </span>
        </p>

        {/* Dismiss — pure white icon, white border, no hover state */}
        <button
          onClick={() => setDismissed(true)}
          aria-label={t("common.dismiss")}
          className="shrink-0 p-1 rounded-full text-[var(--color-washi)] border border-[var(--color-washi)]"
        >
          <X size={12} />
        </button>
      </div>
      </div>
      {/* Spacer — occupies the same height in document flow */}
      <div style={{ height: "var(--banner-h, 0px)" }} />
    </>
  );
}

/**
 * Modal popup shown when user tries to proceed to checkout
 * while the service is temporarily closed.
 * Locks background scrolling while open.
 */
export function ServiceClosedPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Lock body scroll while the popup is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-sumi)]/80 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="bg-[var(--color-washi)] max-w-md w-full p-8 md:p-10 relative border border-[var(--color-shu)]/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-sumi)]/30 hover:text-[var(--color-sumi)] transition-colors"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 bg-[var(--color-shu)]/10 border border-[var(--color-shu)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-7 h-7 text-[var(--color-shu)]" />
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--color-sumi)] text-center mb-4 leading-tight">
              {t("serviceClosed.popupTitle")}
            </h2>

            {/* Description */}
            <p className="text-sm text-[var(--color-sumi)]/60 text-center leading-relaxed mb-6">
              {t("serviceClosed.popupDesc")}
            </p>

            {/* Call CTA */}
            <div className="bg-[var(--color-sumi)]/[0.04] border border-[var(--color-sumi)]/10 p-4 mb-6 text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)]/40 mb-2">
                {t("serviceClosed.popupCta")}
              </p>
              <a
                href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-lg font-serif font-bold text-[var(--color-shu)] hover:text-[#a02020] transition-colors"
              >
                <Phone size={18} />
                {settings.contactPhone}
              </a>
            </div>

            {/* Dismiss button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-[var(--color-sumi)] text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[var(--color-shu)] transition-colors"
            >
              {t("serviceClosed.popupDismiss")}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
