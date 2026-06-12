import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, Users, CheckCircle2, XCircle, Bell, Filter, AlertTriangle } from "lucide-react";
import { updateReservationStatus, type Reservation, type ReservationStatus } from "../services/reservationService";
import { ConfirmationModal } from './ui/ConfirmationModal';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/30",
    icon: <Bell size={14} />,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/30",
    icon: <CheckCircle2 size={14} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30",
    icon: <XCircle size={14} />,
  },
};

function getTimestampMs(field: any): number {
  if (!field) return 0;
  if (typeof field.toDate === 'function') return field.toDate().getTime();
  if (typeof field._seconds === 'number') return field._seconds * 1000 + (field._nanoseconds || 0) / 1e6;
  if (typeof field.seconds === 'number') return field.seconds * 1000 + (field.nanoseconds || 0) / 1e6;
  if (typeof field === 'string') { const ms = new Date(field).getTime(); return isNaN(ms) ? 0 : ms; }
  if (field instanceof Date) { const ms = field.getTime(); return isNaN(ms) ? 0 : ms; }
  return 0;
}

function parseTimestampToDate(field: any): Date | null {
  const ms = getTimestampMs(field);
  return ms > 0 ? new Date(ms) : null;
}

function formatTimeAgo(timestamp: any): string {
  const date = parseTimestampToDate(timestamp);
  if (!date) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("fi-FI");
}

interface AdminReservationsProps {
  reservations: Reservation[];
  isLoadingReservations: boolean;
  reservationsError: string | null;
  onMarkSeen: (id: string) => void;
}

export function AdminReservations({
  reservations,
  isLoadingReservations,
  reservationsError,
  onMarkSeen,
}: AdminReservationsProps) {
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resToCancel, setResToCancel] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: ReservationStatus) => {
    if (newStatus === 'cancelled') {
      setResToCancel(id);
      setIsModalOpen(true);
      return;
    }
    
    try {
      await updateReservationStatus(id, newStatus);
      const res = reservations.find(r => r.id === id);
      if (res && !res.seenAt) {
        onMarkSeen(id);
      }
    } catch (err) {
      console.error("Failed to update reservation status:", err);
    }
  };

  const confirmReject = async () => {
    if (!resToCancel) return;
    try {
      await updateReservationStatus(resToCancel, "cancelled");
      const res = reservations.find(r => r.id === resToCancel);
      if (res && !res.seenAt) {
        onMarkSeen(resToCancel);
      }
    } catch (err) {
      console.error("Failed to reject reservation:", err);
    }
    setResToCancel(null);
    setIsModalOpen(false);
  };

  const filteredReservations = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 border-b border-[var(--color-washi)]/10 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <Filter size={14} className="text-[var(--color-washi)]/30 shrink-0" />
          {(["all", "pending", "confirmed", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-xs tracking-[0.15em] uppercase font-medium whitespace-nowrap transition-all cursor-pointer border ${
                filter === status
                  ? "bg-[var(--color-shu)] border-[var(--color-shu)] text-[var(--color-washi)]"
                  : "border-[var(--color-washi)]/10 text-[var(--color-washi)]/40 hover:border-[var(--color-washi)]/10 hover:text-[var(--color-washi)]/70"
              }`}
            >
              {status === "all"
                ? `All (${reservations.length})`
                : `${status.charAt(0).toUpperCase() + status.slice(1)} (${reservations.filter((r) => r.status === status).length})`
              }
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {isLoadingReservations ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--color-washi)]/40 text-xs tracking-[0.2em] uppercase">
                Loading Reservations...
              </p>
            </div>
          </div>
        ) : reservationsError ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center bg-red-500/10 border border-red-500/20 p-8 max-w-md">
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-sm font-bold mb-2">Error Loading Data</p>
              <p className="text-red-400/60 text-xs">{reservationsError}</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Calendar size={48} className="text-[var(--color-washi)]/10 mx-auto mb-4" />
              <p className="text-[var(--color-washi)]/30 text-sm">No reservations found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredReservations.map((reservation) => {
                const config = STATUS_CONFIG[reservation.status];

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={reservation.id}
                    className={`bg-[var(--color-washi)]/[0.03] border p-5 relative group transition-colors ${
                      !reservation.seenAt
                        ? "border-[var(--color-shu)]/40 ring-1 ring-[var(--color-shu)]/20"
                        : "border-[var(--color-washi)]/10"
                    } ${
                      reservation.status === "pending" && reservation.seenAt ? "ring-1 ring-amber-400/20" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold ${config.bgColor} ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </div>
                      <div className="flex flex-col items-end pr-6 relative">
                        {!reservation.seenAt && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-shu)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-shu)]"></span>
                          </span>
                        )}
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-washi)]/25">
                          #{reservation.id?.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[var(--color-washi)]/30 mt-1">
                          Requested {formatTimeAgo(reservation.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4 border-b border-[var(--color-washi)]/10 pb-4">
                      <p className="font-serif font-bold text-[var(--color-washi)] text-lg">
                        {reservation.customer_info.name}
                      </p>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-[var(--color-washi)]/50">
                        <span>{reservation.customer_info.phone}</span>
                        <span>{reservation.customer_info.email}</span>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-3 rounded-sm flex items-start gap-3">
                         <Calendar className="text-[var(--color-shu)] mt-0.5 shrink-0" size={16} />
                         <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-washi)]/40 mb-1">Date</p>
                            <p className="text-sm font-bold text-[var(--color-washi)]">{reservation.date}</p>
                         </div>
                      </div>
                      <div className="bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-3 rounded-sm flex items-start gap-3">
                         <Clock className="text-[var(--color-shu)] mt-0.5 shrink-0" size={16} />
                         <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-washi)]/40 mb-1">Time</p>
                            <p className="text-sm font-bold text-[var(--color-washi)]">{reservation.time}</p>
                         </div>
                      </div>
                      <div className="col-span-2 bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-3 rounded-sm flex items-start gap-3">
                         <Users className="text-[var(--color-shu)] mt-0.5 shrink-0" size={16} />
                         <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-washi)]/40 mb-1">Guests</p>
                            <p className="text-sm font-bold text-[var(--color-washi)]">{reservation.guests} People</p>
                         </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {reservation.special_requests && (
                      <div className="mb-4 bg-amber-500/5 border border-amber-500/10 p-3 rounded-sm">
                        <p className="text-[10px] tracking-[0.1em] uppercase text-amber-500/60 mb-1">Special Requests</p>
                        <p className="text-xs text-[var(--color-washi)]/70 whitespace-pre-line leading-relaxed">
                          "{reservation.special_requests}"
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-washi)]/10 justify-between items-center">
                      {!reservation.seenAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkSeen(reservation.id!);
                          }}
                          className="px-3 py-1.5 border border-[var(--color-shu)]/30 text-[var(--color-shu)] text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-[var(--color-shu)]/10 transition-colors cursor-pointer"
                        >
                          Mark Seen
                        </button>
                      )}
                      
                      <div className="flex gap-2 flex-1 justify-end">
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(reservation.id!, "confirmed");
                              }}
                              className="px-4 py-2.5 border border-emerald-400/30 text-emerald-400 text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-emerald-400/10 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(reservation.id!, "cancelled");
                              }}
                              className="px-4 py-2.5 border border-red-400/30 text-red-400 text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-red-400/10 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(reservation.id!, "cancelled");
                            }}
                            className="px-4 py-2 border border-[var(--color-washi)]/10 text-[var(--color-washi)]/40 hover:text-red-400 hover:border-red-400/30 text-[10px] tracking-[0.15em] uppercase font-bold transition-colors cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmReject}
        title="Reject Reservation"
        message="Are you sure you want to reject this reservation? This will send an automated notification to the guest and free up the table."
        confirmLabel="Reject Reservation"
        cancelLabel="Dismiss"
      />
    </div>
  );
}
