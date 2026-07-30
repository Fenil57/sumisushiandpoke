import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SEOHead } from "../components/SEOHead";
import { CustomCursor } from "../components/CustomCursor";
import { Instagram, Phone, Mail } from "lucide-react";
import { getSettings, SiteSettings, DEFAULT_SETTINGS } from "../services/settingsService";
import maintenanceBg from "../images/maintenance-bg.png";
import logoImage from "../assets/images/logo.png";

export function Maintenance() {
  const [modalOpen, setModalOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => {
        console.error("Could not fetch live settings for maintenance page:", err);
      });
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const phoneDisplay = settings.contactPhone || "044 2479393";
  const phoneClean = phoneDisplay.replace(/\s+/g, "");
  const addressDisplay = settings.address || "Kuskinkatu 3, 20780 Kaarina, Finland";
  const emailDisplay = settings.contactEmail || "contact@sumisushi.fi";
  const instagramUrl = settings.instagramUrl || "https://instagram.com";

  return (
    <>
      <SEOHead
        title={`Sivustomme On Huollossa | ${settings.restaurantName || "Sumi Sushi"}`}
        description={`${settings.restaurantName || "Sumi Sushi"} - Päivitämme parhaillaan verkkosivustoamme palvellaksemme teitä entistä paremmin. Olkaa hyvä ja palaa pian uudelleen.`}
        canonicalPath="/"
        noIndex={true}
      />

      {/* Interactive Custom Enso Cursor */}
      <CustomCursor />

      {/* Main Fullscreen Maintenance Canvas (16:9 aspect ratio optimized, Full HD responsive) */}
      <div className="relative min-h-screen w-full bg-[var(--color-sumi)] text-[var(--color-washi)] flex items-center justify-center overflow-hidden select-none font-sans cursor-default">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={maintenanceBg}
            alt="Sumi Sushi Background"
            className="w-full h-full object-cover object-center opacity-95 scale-100 transform transition-transform duration-1000 ease-out"
          />
          
          {/* Soft vignette and moody lighting overlay */}
          <div 
            className="absolute inset-0 bg-radial-vignette pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at center, rgba(17, 17, 17, 0.15) 0%, rgba(15, 15, 15, 0.5) 65%, rgba(10, 10, 10, 0.8) 100%),
                linear-gradient(to bottom, rgba(12, 12, 12, 0.15) 0%, rgba(12, 12, 12, 0.05) 50%, rgba(12, 12, 12, 0.3) 100%)
              `
            }}
          />
        </div>

        {/* Ambient Floating Sakura Petal Particles */}
        <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
          {[
            { left: "10%", top: "-5%", delay: 0, duration: 20, size: "w-2.5 h-3.5" },
            { left: "85%", top: "-2%", delay: 3, duration: 22, size: "w-2 h-3" },
            { left: "18%", top: "-10%", delay: 6, duration: 18, size: "w-3 h-4" },
            { left: "80%", top: "-8%", delay: 9, duration: 24, size: "w-2 h-2.5" },
          ].map((petal, idx) => (
            <motion.div
              key={idx}
              initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
              animate={{ 
                y: "110vh", 
                opacity: [0, 0.6, 0.7, 0.3, 0],
                rotate: [0, 90, 180, 270, 360],
                x: [0, 15, -15, 15, 0]
              }}
              transition={{
                duration: petal.duration,
                repeat: Infinity,
                delay: petal.delay,
                ease: "linear"
              }}
              className={`absolute ${petal.size} bg-[#7A0C0C]/80 rounded-full blur-[0.3px] shadow-sm`}
              style={{
                left: petal.left,
                top: petal.top,
                borderRadius: "80% 0 80% 0",
              }}
            />
          ))}
        </div>

        {/* Central UI Content */}
        <div className="relative z-10 max-w-xl w-full px-6 py-8 text-center flex flex-col items-center justify-center my-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center w-full"
          >
            {/* Official Brand Logo */}
            <div className="flex flex-col items-center justify-center mb-8">
              <img
                src={logoImage}
                alt="Sumi Sushi Logo"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Small Red Pre-Heading Text - Finnish */}
            <span className="text-[11px] md:text-xs font-serif tracking-[0.35em] text-[#c92a2a] uppercase font-medium mb-1">
              SIVUSTOMME ON
            </span>

            {/* Main Heading - Finnish */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-[0.2em] text-white uppercase mb-3 drop-shadow-md">
              HUOLLOSSA
            </h1>

            {/* Small subtle red divider line */}
            <div className="w-10 h-[1.5px] bg-[#c92a2a] mb-5 opacity-80" />

            {/* Subtitle / Paragraph Text - Finnish */}
            <p className="max-w-md text-xs sm:text-sm text-white/75 font-sans font-light tracking-wide leading-relaxed mb-8">
              Päivitämme parhaillaan verkkosivustoamme palvellaksemme teitä entistä paremmin. Olkaa hyvä ja palaa pian uudelleen.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Primary Outlined Button - Finnish */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(201, 42, 42, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalOpen(true)}
                className="px-8 py-3 text-xs font-sans font-medium tracking-[0.25em] text-white uppercase transition-all duration-300 border border-[#7A0C0C] hover:border-[#c92a2a] bg-black/40 backdrop-blur-xs cursor-pointer"
              >
                PYSY AJAN TASALLA
              </motion.button>

              {/* Secondary Reload Button */}
              <button
                onClick={handleReload}
                className="px-6 py-3 text-xs font-sans tracking-[0.2em] text-white/60 hover:text-white uppercase transition-colors duration-200 cursor-pointer"
              >
                PÄIVITÄ SIVU
              </button>
            </div>

            {/* Footer Icons (Instagram | Phone | Email) - Dynamic from Firestore */}
            <div className="flex items-center justify-center gap-4 mt-10 text-white/60 text-xs">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && <span className="text-white/20">|</span>}
              <a
                href={`tel:${phoneClean}`}
                aria-label="Puhelin"
                className="hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" />
              </a>
              {emailDisplay && <span className="text-white/20">|</span>}
              {emailDisplay && (
                <a
                  href={`mailto:${emailDisplay}`}
                  aria-label="Sähköposti"
                  className="hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer Subtitle / Location from Firestore */}
        <div className="absolute bottom-4 left-0 right-0 z-10 text-center pointer-events-none">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/35 font-light px-4">
            {settings.restaurantName || "Sumi Sushi & Poke"} &bull; {addressDisplay.replace(/\n/g, ", ")}
          </p>
        </div>
      </div>

      {/* Elegant Restaurant Information Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 cursor-default">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative max-w-md w-full bg-[#181818] border border-white/10 p-8 text-center shadow-2xl rounded-sm"
            >
              {/* Official Logo replacing the 'taste' text circle */}
              <div className="flex items-center justify-center mx-auto mb-5">
                <img
                  src={logoImage}
                  alt="Sumi Sushi Logo"
                  className="h-12 w-auto object-contain drop-shadow-md"
                />
              </div>

              <h3 className="text-xl font-serif text-white mb-2">
                Odotamme Innoissamme Tapaamistamme
              </h3>
              <p className="text-sm text-white/70 mb-6 font-sans leading-relaxed">
                Keittiötiimimme hiotuttaa jokaista yksityiskohtaa. Kiireellisissä tiedusteluissa tai pöytävarauksissa voitte ottaa meihin suoraan yhteyttä.
              </p>
              
              <div className="bg-[#101010]/90 p-4 border border-white/10 mb-6 text-xs text-white/80 space-y-2 font-mono text-left">
                <p><span className="text-[#c92a2a] font-bold">Osoite:</span> {addressDisplay.replace(/\n/g, ", ")}</p>
                <p><span className="text-[#c92a2a] font-bold">Puhelin:</span> <a href={`tel:${phoneClean}`} className="hover:underline">{phoneDisplay}</a></p>
                {emailDisplay && (
                  <p><span className="text-[#c92a2a] font-bold">Sähköposti:</span> <a href={`mailto:${emailDisplay}`} className="hover:underline">{emailDisplay}</a></p>
                )}
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-full py-3 text-xs tracking-[0.2em] uppercase font-medium bg-[#c92a2a] text-white hover:bg-[#a31c1c] transition-colors duration-200 cursor-pointer"
              >
                SULJE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
