import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Calendar, Clock, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import successIllustration from '../assets/reservation-success.png';

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

  // Available Time Slots
  const timeSlots = [
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      const response = await fetch('/api/reservations', {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reservation.');
      }

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
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6 relative overflow-hidden">
      {/* Autofill and Custom Input Styles */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 100px var(--color-sumi) inset !important;
            -webkit-text-fill-color: var(--color-washi) !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Modern Select styling hint */
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[550px]"
              >
                <div className="w-full max-w-[280px] mb-10 overflow-hidden rounded-2xl">
                   <motion.img 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    src={successIllustration} 
                    alt="Reservation Confirmed" 
                    className="w-full h-auto object-cover"
                   />
                </div>
                
                <h3 className="text-4xl font-serif text-[var(--color-washi)] mb-4">{t('reservations.successTitle')}</h3>
                <p className="text-[var(--color-washi)]/60 max-w-md mx-auto mb-12 text-lg leading-relaxed font-light">
                  {t('reservations.successDesc')}
                </p>
                <button
                  onClick={resetForm}
                  className="group relative px-10 py-4 border border-[var(--color-washi)]/20 text-[var(--color-washi)] text-[10px] tracking-[0.3em] uppercase font-bold transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[var(--color-washi)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative z-10 group-hover:text-[var(--color-sumi)]">{t('reservations.submitNew')}</span>
                </button>
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
                    className="mb-10 p-5 bg-red-500/10 border border-red-500/20 flex items-start gap-4 rounded-2xl"
                  >
                    <AlertCircle size={24} className="text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-bold text-sm mb-1 uppercase tracking-wider">{t('reservations.errorTitle')}</h4>
                      <p className="text-red-400/70 text-sm leading-relaxed">{errorMsg}</p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Name Input */}
                  <div className="space-y-3">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formName')}
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('reservations.formNamePlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-3">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formPhone')}
                    </label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('reservations.formPhonePlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formEmail')}
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('reservations.formEmailPlaceholder')}
                      className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] placeholder-[var(--color-washi)]/10 focus:outline-none focus:border-[var(--color-shu)] transition-all no-highlight text-lg"
                    />
                  </div>

                  {/* Date Input */}
                  <div className="space-y-3 relative">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formDate')}
                    </label>
                    <div className="relative group">
                      <input
                        required
                        type="date"
                        min={today}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all cursor-pointer appearance-none z-10 relative no-highlight text-lg [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" />
                    </div>
                  </div>

                  {/* Time Input */}
                  <div className="space-y-3 relative">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formTime')}
                    </label>
                    <div className="relative group">
                      <select
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer text-lg relative z-10 no-highlight"
                      >
                        <option value="" disabled className="bg-[var(--color-sumi)]">Select time</option>
                        {timeSlots.map(slot => <option key={slot} value={slot} className="bg-[var(--color-sumi)]">{slot}</option>)}
                      </select>
                      <ChevronDown size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" />
                    </div>
                  </div>

                  {/* Guests Input */}
                  <div className="space-y-3 relative md:col-span-2">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40">
                      {t('reservations.formGuests')}
                    </label>
                    <div className="relative group">
                      <select
                        required
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--color-washi)]/10 px-0 py-4 text-[var(--color-washi)] focus:outline-none focus:border-[var(--color-shu)] transition-all appearance-none cursor-pointer text-lg relative z-10 no-highlight"
                      >
                        {[...Array(12)].map((_, i) => (
                           <option key={i+1} value={i+1} className="bg-[var(--color-sumi)]">
                             {i+1} {i+1 === 1 ? 'Guest' : 'Guests'}
                           </option>
                        ))}
                        <option value="13" className="bg-[var(--color-sumi)]">More than 12 (Clarify in requests)</option>
                      </select>
                      <Users size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/20 group-hover:text-[var(--color-shu)] transition-colors pointer-events-none z-0" />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="block text-[10px] tracking-[0.25em] uppercase font-bold text-[var(--color-washi)]/40 flex items-center gap-2">
                      <MessageSquare size={12} /> {t('reservations.formRequests')}
                    </label>
                    <textarea
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
                          <div className="w-5 h-5 border-2 border-[var(--color-washi)]/30 border-t-[var(--color-washi)] rounded-full animate-spin" />
                          {t('reservations.submitting')}
                        </>
                      ) : (
                        t('reservations.submitButton')
                      )}
                    </span>
                  </button>
                  <p className="mt-6 text-[var(--color-washi)]/30 text-[10px] tracking-widest uppercase font-bold italic">
                    All tables are held for 15 minutes past reservation time.
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
