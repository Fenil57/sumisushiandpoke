import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import { useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const location = useLocation();

  // Always force scroll to top on a brand-new page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          
          <div className="relative z-10">
            <BrandLogo
              stacked
              imageClassName="h-20 w-20 object-contain"
              textClassName="text-3xl md:text-4xl font-bold tracking-[0.16em] text-[#f9f6f0]"
              subtextClassName="text-xs tracking-[0.28em] uppercase text-[#c92a2a]"
            />
            <motion.div 
              className="absolute inset-0 bg-[#c92a2a] blur-xl opacity-20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <div className="text-[#f9f6f0] flex flex-col items-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-widest mb-3 text-center">
              {settings.restaurantName.toUpperCase()}
            </h1>
            <p className="text-sm tracking-[0.3em] text-[#f9f6f0]/60 uppercase ml-2 mb-8">
              Experience Authentic Taste
            </p>
            
            <div className="w-64 h-[1px] bg-[#f9f6f0]/20 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 bottom-0 w-full bg-[var(--color-shu)]"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            </div>
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
