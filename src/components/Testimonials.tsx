import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function Testimonials() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: t('testimonials.t1Text'),
      author: t('testimonials.t1Author'),
      role: t('testimonials.t1Role'),
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    },
    {
      quote: t('testimonials.t2Text'),
      author: t('testimonials.t2Author'),
      role: t('testimonials.t2Role'),
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      quote: t('testimonials.t3Text'),
      author: t('testimonials.t3Author'),
      role: t('testimonials.t3Role'),
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 bg-[var(--color-sumi)] text-[var(--color-washi)] relative overflow-hidden flex flex-col items-center justify-center min-h-[40vh]">
      {/* Decorative background element */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-washi) 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>

      <div className="max-w-5xl mx-auto relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('testimonials.voices')}</p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
        </motion.div>

        <div className="min-h-[300px] md:min-h-[250px] flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center text-center w-full"
            >
              <div className="text-5xl md:text-7xl text-[var(--color-shu)] font-serif leading-none opacity-20">"</div>
              
              <p className="text-lg md:text-2xl lg:text-3xl font-serif leading-relaxed text-[var(--color-washi)] py-4 md:py-6 max-w-3xl">
                {testimonials[currentIndex].quote}
              </p>
              
              <div className="w-12 h-[1px] bg-[var(--color-washi)]/20 mb-6"></div>
              
              <div className="flex items-center gap-4">
                <img src={testimonials[currentIndex].img} alt={testimonials[currentIndex].author} className="w-12 h-12 rounded-full object-cover grayscale" referrerPolicy="no-referrer" />
                <div className="text-left">
                  <div className="text-xs font-bold tracking-widest uppercase text-[var(--color-washi)]">{testimonials[currentIndex].author}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/50 mt-1">{testimonials[currentIndex].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Custom Pagination */}
        <div className="flex justify-center gap-1 mt-6">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="p-3 group cursor-pointer"
              aria-label={`Go to testimonial ${idx + 1}`}
            >
              <div className={`h-[2px] transition-all duration-500 ${currentIndex === idx ? 'w-12 bg-[var(--color-shu)]' : 'w-6 bg-[var(--color-washi)]/20 group-hover:bg-[var(--color-washi)]/50'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
