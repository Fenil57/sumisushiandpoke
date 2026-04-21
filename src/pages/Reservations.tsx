import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Calendar, Clock, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getApiUrl, readApiJson } from '../lib/api';
import { RESERVATION_TIME_SLOTS } from '../constants/reservations';
import { SEOHead } from '../components/SEOHead';

export function Reservations() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Submission state
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [manageUrl, setManageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      const response = await fetch(getApiUrl('/api/reservations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          date,
          time,
          guests: parseInt(guests, 10),
          specialRequests
        })
      });

      const data = await readApiJson<{ success: boolean; id: string; manageUrl?: string }>(
        response,
        'Failed to submit reservation.',
      );

      setManageUrl(data.manageUrl || '');
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'We could not submit your reservation. Please try again.');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDate('');
    setTime('');
    setGuests('2');
    setSpecialRequests('');
    setStatus('idle');
    setManageUrl('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6 relative overflow-hidden">
      <SEOHead
        title="Book a Table | Sumi Sushi & Poke – Reservations in Kaarina"
        description="Reserve your table at Sumi Sushi and Poke in Kaarina, Finland. Enjoy authentic Japanese cuisine in a warm, intimate setting. Book online or call us."
        canonicalPath="/reservations"
      />
      {/* Autofill and Custom Input Styles */}
      <style>{`
        select option {
          background-color: var(--color-sumi);
          color: var(--color-washi);
          padding: 10px;
        }

        .no-highlight:focus {
          background-color: transparent !important;
        }
      `}</style>

      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-washi) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute -left-64 top-1/4 w-[500px] h-[500px] rounded-full bg-[var(--color-shu)]/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-64 bottom-1/4 w-[600px] h-[600px] rounded-full bg-[var(--color-aizome)]/5 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t('reservations.tag')}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>

          <h1 className="text-4xl md:text-7xl font-serif font-bold text-[var(--color-washi)] mb-4">
            {t('reservations.title')}{' '}
            <span className="italic font-light opacity-70">
              {t('reservations.titleItalic')}
            </span>
          </h1>

          <p className="text-[var(--color-washi)]/60 max-w-2xl mx-auto text-lg leading-relaxed">
            {t('reservations.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="rounded-[2.5rem] border border-[var(--color-washi)]/10 bg-[var(--color-sumi)]/40 backdrop-blur-xl overflow-hidden relative shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className="p-12 md:p-24 text-center flex flex-col items-center justify-center min-h-[600px]"
              >
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="mb-12 relative flex items-center justify-center"
                >
                  {/* Elegant, thin outer halo */}
                  <motion.div 
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                    className="absolute w-28 h-28 border border-green-500/20 rounded-full"
                  />
                  
                  {/* Secondary thin ring */}
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
                    className="absolute w-24 h-24 border border-green-500/10 rounded-full"
                  />

                  {/* Animated Drawing Check Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <div className="p-4 bg-green-500/5 rounded-full backdrop-blur-sm">
                      <svg
                        width="42"
                        height="42"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M4 12l5 5L20 6"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ 
                            delay: 0.5, 
                            duration: 0.8, 
                            ease: [0.19, 1, 0.22, 1] 
                          }}
                        />
                      </svg>
                    </div>
                  </motion.div>
                  
                  {/* Ambient ambient glow */}
                  <motion.div 
                    animate={{ 
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-16 h-16 bg-green-500/20 blur-3xl -z-10"
                  />
                </motion.div>
                
                <h3 className="text-4xl md:text-5xl font-serif text-[var(--color-washi)] mb-6 tracking-tight">
                  {t('reservations.successTitle')}
                </h3>
                
                <p className="text-[var(--color-washi)]/60 max-w-lg mx-auto mb-16 text-lg leading-relaxed font-light">
                  {t('reservations.successDesc')}
                </p>

                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                  {manageUrl && (
                    <div className="w-full space-y-4">
                      <a
                        href={manageUrl}
                        className="group relative flex w-full items-center justify-center px-10 py-5 bg-[var(--color-shu)] text-[var(--color-washi)] text-[11px] tracking-[0.4em] uppercase font-black transition-all hover:shadow-[0_10px_40px_rgba(201,42,42,0.3)] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative z-10">{t('reservations.manageLinkButton')}</span>
                      </a>
                      <p className="text-[var(--color-washi)]/30 text-[10px] tracking-[0.2em] uppercase font-medium">
                        {t('reservations.manageLinkHint')}
                      </p>
                    </div>
                  )}

                  <div className="w-full pt-4 border-t border-[var(--color-washi)]/5">
                    <button
                      onClick={resetForm}
                      className="group flex w-full items-center justify-center px-10 py-5 border border-[var(--color-washi)]/10 text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] text-[10px] tracking-[0.4em] uppercase font-bold transition-all hover:bg-[var(--color-washi)]/5"
                    >
                      <span>{t('reservations.submitNew')}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="p-8 md:p-16"
              >
                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    role="alert"
                    aria-live="assertive"
                    className="mb-10 p-5 bg-red-500/10 border border-red-500/20 flex items-start gap-4 rounded-2xl"
                  >
                    <AlertCircle size={24} className="text-red-400 shrink-0" aria-hidden="true" />
                    <div>
                      <h4 className="text-red-400 font-bold text-sm mb-1 uppercase tracking-wider">{t('reservations.errorTitle')}</h4>
                      <p className="text-red-400/70 text-sm leading-relaxed">{errorMsg}</p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Name Input */}
                  <div className="space-y-3">
                    <label htmlFor="reservation-name" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formName')}
                    </label>
                    <input
                      id="reservation-name"
                      required
                      aria-required="true"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('reservations.formNamePlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-3">
                    <label htmlFor="reservation-phone" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formPhone')}
                    </label>
                    <input
                      id="reservation-phone"
                      required
                      aria-required="true"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('reservations.formPhonePlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-3 md:col-span-2">
                    <label htmlFor="reservation-email" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formEmail')}
                    </label>
                    <input
                      id="reservation-email"
                      required
                      aria-required="true"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('reservations.formEmailPlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Date Input */}
                  <div className="space-y-3 relative">
                    <label htmlFor="reservation-date" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formDate')}
                    </label>
                    <div className="relative group">
                      <input
                        id="reservation-date"
                        required
                        aria-required="true"
                        type="date"
                        min={today}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all cursor-pointer appearance-none z-10 relative no-highlight text-lg [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Time Input */}
                  <div className="space-y-3 relative">
                    <label htmlFor="reservation-time" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formTime')}
                    </label>
                    <div className="relative group">
                      <select
                        id="reservation-time"
                        required
                        aria-required="true"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer text-lg relative z-10 no-highlight"
                      >
                        <option value="" disabled className="bg-[var(--color-sumi)]">{t('reservations.formTimePlaceholder')}</option>
                        {RESERVATION_TIME_SLOTS.map((slot) => <option key={slot} value={slot} className="bg-[var(--color-sumi)]">{slot}</option>)}
                      </select>
                      <ChevronDown size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Guests Input */}
                  <div className="space-y-3 relative md:col-span-2">
                    <label htmlFor="reservation-guests" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formGuests')}
                    </label>
                    <div className="relative group">
                      <select
                        id="reservation-guests"
                        required
                        aria-required="true"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer text-lg relative z-10 no-highlight"
                      >
                        {[...Array(12)].map((_, i) => (
                           <option key={i+1} value={i+1} className="bg-[var(--color-sumi)]">
                             {i+1} {i+1 === 1 ? t('reservations.guestSingle') : t('reservations.guestPlural')}
                           </option>
                        ))}
                        <option value="13" className="bg-[var(--color-sumi)]">{t('reservations.moreThanTwelve')}</option>
                      </select>
                      <Users size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-3 md:col-span-2">
                    <label htmlFor="reservation-requests" className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40 flex items-center gap-2">
                      <MessageSquare size={12} aria-hidden="true" /> {t('reservations.formRequests')}
                    </label>
                    <textarea
                      id="reservation-requests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={t('reservations.formRequestsPlaceholder')}
                      rows={4}
                      className="w-full bg-transparent border border-[var(--color-washi)]/10 rounded-2xl p-5 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all resize-none text-base leading-relaxed"
                    />
                  </div>
                </div>

                <div className="mt-16 flex flex-col items-center pt-10 border-t border-[var(--color-washi)]/10">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group relative overflow-hidden px-16 py-6 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.3em] uppercase font-black transition-all min-w-[300px] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(194,59,34,0.3)]"
                  >
                    <div className="absolute inset-0 bg-[#a02020] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      {status === 'submitting' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-[var(--color-washi)]/30 border-t-[var(--color-washi)] rounded-full animate-spin" role="status" aria-label="Submitting reservation" />
                          {t('reservations.submitting')}
                        </>
                      ) : (
                        t('reservations.submitButton')
                      )}
                    </span>
                  </button>
                  <p className="mt-6 text-[var(--color-washi)]/30 text-[10px] tracking-widest uppercase font-bold italic">
                    {t('reservations.tableHoldNote')}
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/5">
            <p className="text-[var(--color-washi)]/40 text-[11px] tracking-wider font-medium">
              {t('reservations.fallback')}
            </p>
            <a
              href={`tel:${settings.contactPhone}`}
              className="text-[var(--color-shu)] hover:underline font-bold"
            >
              {settings.contactPhone}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
