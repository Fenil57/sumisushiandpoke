import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../hooks/useSettings';
import { useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const location = useLocation();

  // Handle scroll position on new page mount
  useEffect(() => {
    if (location.hash) {
      // Scroll to top initially so the page is ready behind the overlay
      window.scrollTo(0, 0);
      // Wait for the transition to finish (1.5s delay + 0.8s sweep = 2.3s)
      const timeoutId = setTimeout(() => {
        const id = location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 2400);
      return () => clearTimeout(timeoutId);
    } else {
      // Standard page load without hash
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <>
      {/* 
        ========================================================
        1. ENTER SWEEP (Uncovering the newly mounted page)
        ========================================================
        This overlay rests fully covering the screen (y=0) when the component mounts. 
        It stays for ~1.5s to fake loading/image parsing, then sweeps up (-100%) revealing the new route.
      */}
      <motion.div
        className="fixed inset-0 z-[100] bg-[#1c1c1c] flex items-center justify-center p-6 text-center transform-gpu"
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 1.5 }}
        style={{ pointerEvents: 'none' }}
      >
        <motion.div 
          className="flex flex-col items-center gap-6 relative"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-serif opacity-5 text-[#f9f6f0] pointer-events-none select-none">
            {settings.restaurantKanji}
          </div>
          
          <div className="relative z-10 w-full max-w-[calc(100vw-3rem)]">
            <BrandLogo
              stacked
              imageClassName="h-20 w-20 object-contain"
              textClassName="text-[clamp(1.45rem,6vw,3rem)] md:text-5xl font-serif font-bold tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.16em] text-[#f9f6f0] leading-tight break-words"
              subtextClassName="text-[clamp(0.65rem,2.4vw,0.875rem)] md:text-sm tracking-[0.28em] sm:tracking-[0.4em] uppercase text-[#c92a2a] mt-2"
            />
            <motion.div 
              className="absolute inset-0 bg-[#c92a2a] blur-2xl opacity-20"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          
          <div className="w-64 h-[1px] bg-[#f9f6f0]/20 relative overflow-hidden mt-8">
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-full bg-[#c92a2a]"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* 
        ========================================================
        2. EXIT SWEEP (Covering the old page before it unmounts)
        ========================================================
        This overlay rests off-screen at the bottom (y=100%).
        When this route is asked to unmount by AnimatePresence, it sweeps UP to cover the screen (y=0).
      */}
      <motion.div
        className="fixed inset-0 z-[100] bg-[#1c1c1c] pointer-events-none transform-gpu"
        initial={{ y: '100%' }}
        animate={{ y: '100%' }}
        exit={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* The actual page content rendering immediately so it's ready behind the screen */}
      {children}
    </>
  );
}
