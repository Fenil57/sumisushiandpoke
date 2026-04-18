import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiUrl, readApiJson } from "../lib/api";
import { RESERVATION_TIME_SLOTS } from "../constants/reservations";

type ReservationStatus = "pending" | "confirmed" | "cancelled";

interface ManagedReservationResponse {
  reservation: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    time: string;
    guests: number;
    specialRequests: string;
    status: ReservationStatus;
    createdAt: string | null;
    updatedAt: string | null;
  };
  permissions: {
    canManage: boolean;
    canEdit: boolean;
    canCancel: boolean;
    reason?: string;
    contactPhone: string;
    editCutoffHours: number;
  };
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  confirmed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
};

export function ReservationManage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";

  const [data, setData] = useState<ManagedReservationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    async function loadReservation() {
      if (!reservationId || !token) {
        setErrorMsg(t("reservations.manage.invalidLink"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMsg("");

      try {
        const response = await fetch(
          getApiUrl(`/api/reservations/${encodeURIComponent(reservationId)}/manage?token=${encodeURIComponent(token)}`),
        );
        const payload = await readApiJson<ManagedReservationResponse>(
          response,
          t("reservations.manage.loadFailed"),
        );

        setData(payload);
        setDate(payload.reservation.date);
        setTime(payload.reservation.time);
        setGuests(String(payload.reservation.guests));
        setSpecialRequests(payload.reservation.specialRequests || "");
      } catch (error: any) {
        setErrorMsg(error.message || t("reservations.manage.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }

    loadReservation();
  }, [reservationId, token, t]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || isSaving || !data.permissions.canEdit) {
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(
        getApiUrl(`/api/reservations/${encodeURIComponent(data.reservation.id)}/manage`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            date,
            time,
            guests: parseInt(guests, 10),
            specialRequests,
          }),
        },
      );
      const payload = await readApiJson<ManagedReservationResponse>(
        response,
        t("reservations.manage.updateFailed"),
      );

      setData(payload);
      setDate(payload.reservation.date);
      setTime(payload.reservation.time);
      setGuests(String(payload.reservation.guests));
      setSpecialRequests(payload.reservation.specialRequests || "");
      setSuccessMsg(
        payload.reservation.status === "pending"
          ? t("reservations.manage.updatedPending")
          : t("reservations.manage.updatedSuccess"),
      );
    } catch (error: any) {
      setErrorMsg(error.message || t("reservations.manage.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!data || isCancelling || !data.permissions.canCancel) {
      return;
    }

    if (!window.confirm(t("reservations.manage.cancelConfirm"))) {
      return;
    }

    setIsCancelling(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(
        getApiUrl(`/api/reservations/${encodeURIComponent(data.reservation.id)}/cancel`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
      const payload = await readApiJson<ManagedReservationResponse>(
        response,
        t("reservations.manage.cancelFailed"),
      );

      setData(payload);
      setSuccessMsg(t("reservations.manage.cancelledSuccess"));
    } catch (error: any) {
      setErrorMsg(error.message || t("reservations.manage.cancelFailed"));
    } finally {
      setIsCancelling(false);
    }
  };

  const reservation = data?.reservation;
  const permissions = data?.permissions;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(var(--color-washi) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      <div className="absolute -left-64 top-1/4 w-[500px] h-[500px] rounded-full bg-[var(--color-shu)]/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-64 bottom-1/4 w-[600px] h-[600px] rounded-full bg-[var(--color-aizome)]/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]" />
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t("reservations.tag")}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold text-[var(--color-washi)] mb-4">
            {t("reservations.manage.title")}
          </h1>
          <p className="text-[var(--color-washi)]/60 max-w-2xl mx-auto text-lg leading-relaxed">
            {t("reservations.manage.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-[2.5rem] border border-[var(--color-washi)]/10 bg-[var(--color-sumi)]/40 backdrop-blur-xl overflow-hidden relative shadow-2xl"
        >
          {isLoading ? (
            <div className="p-16 md:p-24 text-center">
              <div className="w-12 h-12 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[var(--color-washi)]/50 text-sm tracking-[0.25em] uppercase">
                {t("reservations.manage.loading")}
              </p>
            </div>
          ) : errorMsg && !data ? (
            <div className="p-12 md:p-16 text-center">
              <AlertCircle size={40} className="mx-auto mb-4 text-red-400" />
              <h2 className="text-3xl font-serif text-[var(--color-washi)] mb-3">
                {t("reservations.manage.errorTitle")}
              </h2>
              <p className="text-red-300/80 max-w-lg mx-auto mb-8">{errorMsg}</p>
              <Link
                to="/reservations"
                className="inline-flex px-8 py-3 border border-[var(--color-washi)]/20 text-[var(--color-washi)] text-[10px] tracking-[0.28em] uppercase font-bold"
              >
                {t("reservations.manage.backToReservations")}
              </Link>
            </div>
          ) : reservation && permissions ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-0">
              <div className="p-8 md:p-12 border-b xl:border-b-0 xl:border-r border-[var(--color-washi)]/10">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <span className={`px-4 py-2 text-[10px] uppercase tracking-[0.25em] border ${STATUS_STYLES[reservation.status]}`}>
                    {t(`reservations.manage.status.${reservation.status}`)}
                  </span>
                  <span className="text-[var(--color-washi)]/35 text-xs tracking-[0.2em] uppercase">
                    #{reservation.id.slice(-8).toUpperCase()}
                  </span>
                </div>

                {errorMsg && (
                  <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-300 shrink-0 mt-0.5" />
                    <p className="text-red-300/85 text-sm leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-300 shrink-0 mt-0.5" />
                    <p className="text-emerald-300/85 text-sm leading-relaxed">{successMsg}</p>
                  </div>
                )}

                {permissions.reason && (
                  <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-amber-200/85 text-sm leading-relaxed">{permissions.reason}</p>
                  </div>
                )}

                <form onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 md:col-span-2">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formName")}
                      </label>
                      <div className="border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] text-lg">
                        {reservation.customerName}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formEmail")}
                      </label>
                      <div className="border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)]/70 text-lg">
                        {reservation.customerEmail}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formPhone")}
                      </label>
                      <div className="border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)]/70 text-lg">
                        {reservation.customerPhone}
                      </div>
                    </div>

                    <div className="space-y-3 relative">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formDate")}
                      </label>
                      <div className="relative group">
                        <input
                          required
                          type="date"
                          min={today}
                          value={date}
                          onChange={(event) => setDate(event.target.value)}
                          disabled={!permissions.canEdit}
                          className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all cursor-pointer appearance-none disabled:opacity-40 text-lg [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <Calendar size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3 relative">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formTime")}
                      </label>
                      <div className="relative group">
                        <select
                          required
                          value={time}
                          onChange={(event) => setTime(event.target.value)}
                          disabled={!permissions.canEdit}
                          className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer disabled:opacity-40 text-lg"
                        >
                          <option value="" disabled className="bg-[var(--color-sumi)]">
                            {t("reservations.formTimePlaceholder")}
                          </option>
                          {RESERVATION_TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot} className="bg-[var(--color-sumi)]">
                              {slot}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2 relative">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                        {t("reservations.formGuests")}
                      </label>
                      <div className="relative group">
                        <select
                          required
                          value={guests}
                          onChange={(event) => setGuests(event.target.value)}
                          disabled={!permissions.canEdit}
                          className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer disabled:opacity-40 text-lg"
                        >
                          {[...Array(12)].map((_, index) => (
                            <option key={index + 1} value={index + 1} className="bg-[var(--color-sumi)]">
                              {index + 1} {index + 1 === 1 ? t("reservations.guestSingle") : t("reservations.guestPlural")}
                            </option>
                          ))}
                          <option value="13" className="bg-[var(--color-sumi)]">
                            {t("reservations.moreThanTwelve")}
                          </option>
                        </select>
                        <Users size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40 flex items-center gap-2">
                        <MessageSquare size={12} /> {t("reservations.formRequests")}
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(event) => setSpecialRequests(event.target.value)}
                        rows={4}
                        disabled={!permissions.canEdit}
                        placeholder={t("reservations.formRequestsPlaceholder")}
                        className="w-full bg-transparent border border-[var(--color-washi)]/10 rounded-2xl p-5 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all resize-none disabled:opacity-40 text-base leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={!permissions.canEdit || isSaving}
                      className="group relative overflow-hidden px-10 py-4 bg-[var(--color-shu)] text-[var(--color-washi)] text-[10px] tracking-[0.3em] uppercase font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-[#a02020] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                      <span className="relative z-10">
                        {isSaving ? t("reservations.manage.saving") : t("reservations.manage.saveButton")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={!permissions.canCancel || isCancelling}
                      className="px-10 py-4 border border-red-400/30 text-red-300 text-[10px] tracking-[0.3em] uppercase font-black transition-all hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? t("reservations.manage.cancelling") : t("reservations.manage.cancelButton")}
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-8 md:p-12 bg-[var(--color-washi)]/[0.03]">
                <h2 className="text-2xl font-serif text-[var(--color-washi)] mb-8">
                  {t("reservations.manage.summaryTitle")}
                </h2>

                <div className="space-y-4">
                  <div className="bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-4 rounded-2xl flex items-start gap-3">
                    <Calendar className="text-[var(--color-shu)] mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-washi)]/40 mb-1">
                        {t("reservations.formDate")}
                      </p>
                      <p className="text-sm font-bold text-[var(--color-washi)]">{reservation.date}</p>
                    </div>
                  </div>
                  <div className="bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-4 rounded-2xl flex items-start gap-3">
                    <Clock className="text-[var(--color-shu)] mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-washi)]/40 mb-1">
                        {t("reservations.formTime")}
                      </p>
                      <p className="text-sm font-bold text-[var(--color-washi)]">{reservation.time}</p>
                    </div>
                  </div>
                  <div className="bg-[var(--color-sumi)]/50 border border-[var(--color-washi)]/5 p-4 rounded-2xl flex items-start gap-3">
                    <Users className="text-[var(--color-shu)] mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-washi)]/40 mb-1">
                        {t("reservations.formGuests")}
                      </p>
                      <p className="text-sm font-bold text-[var(--color-washi)]">
                        {reservation.guests} {reservation.guests === 1 ? t("reservations.guestSingle") : t("reservations.guestPlural")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-[var(--color-washi)]/10 bg-[var(--color-sumi)]/45 p-5">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/35 mb-3">
                    {t("reservations.manage.helpTitle")}
                  </p>
                  <p className="text-[var(--color-washi)]/65 text-sm leading-relaxed mb-4">
                    {t("reservations.manage.helpBody", { hours: permissions.editCutoffHours })}
                  </p>
                  <a
                    href={`tel:${permissions.contactPhone}`}
                    className="text-[var(--color-shu)] font-semibold hover:underline"
                  >
                    {permissions.contactPhone}
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/reservations"
                    className="inline-flex px-6 py-3 border border-[var(--color-washi)]/15 text-[var(--color-washi)] text-[10px] tracking-[0.25em] uppercase font-bold"
                  >
                    {t("reservations.manage.backToReservations")}
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex px-6 py-3 border border-[var(--color-washi)]/15 text-[var(--color-washi)]/70 text-[10px] tracking-[0.25em] uppercase font-bold"
                  >
                    {t("reservations.manage.backHome")}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
