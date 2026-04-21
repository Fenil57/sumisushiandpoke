import React, { useEffect } from "react";
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
          />

          {/* Screen Corner Close Button */}
          <button
            onClick={onClose}
            className="fixed top-8 right-8 z-[102] text-white"
          >
            <X size={32} />
          </button>

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[var(--color-sumi)] border border-[var(--color-shu)]/20 w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto relative"
            >
              {/* Header with Pattern */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-shu)] to-transparent opacity-50" />

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isDestructive ? "bg-[var(--color-shu)]/10 text-[var(--color-shu)]" : "bg-blue-500/10 text-blue-500"}`}
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[var(--color-washi)] mb-1">
                      {title}
                    </h3>
                    <p className="text-sm text-[var(--color-washi)]/60 leading-relaxed">
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
