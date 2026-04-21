import React, { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that triggered the modal so we can restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Restore focus to trigger element
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Keyboard: Escape to close + focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4"
            aria-hidden="true"
          />

          {/* Screen Corner Close Button */}
          <button
            onClick={onClose}
            className="fixed top-8 right-8 z-[102] text-white"
            aria-label="Close dialog"
          >
            <X size={32} aria-hidden="true" />
          </button>

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              className="bg-[var(--color-sumi)] border border-[var(--color-shu)]/20 w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto relative"
            >
              {/* Header with Pattern */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-shu)] to-transparent opacity-50" aria-hidden="true" />

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isDestructive ? "bg-[var(--color-shu)]/10 text-[var(--color-shu)]" : "bg-blue-500/10 text-blue-500"}`}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3
                      id="modal-title"
                      className="text-lg font-medium text-[var(--color-washi)] mb-1"
                    >
                      {title}
                    </h3>
                    <p
                      id="modal-description"
                      className="text-sm text-[var(--color-washi)]/60 leading-relaxed"
                    >
                      {message}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] transition-colors"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`px-6 py-2 text-xs uppercase tracking-widest text-white transition-all shadow-lg ${
                      isDestructive
                        ? "bg-[var(--color-shu)] hover:bg-[var(--color-shu)]/80 shadow-[var(--color-shu)]/20"
                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                    }`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
