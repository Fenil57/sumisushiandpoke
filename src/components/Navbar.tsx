import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const isOrderPage = location.pathname === '/order';
  const useWhiteText = location.pathname === '/gallery' && !isScrolled;
  
  const textColorClass = useWhiteText ? 'text-[var(--color-washi)]' : 'text-[var(--color-sumi)]';
  const hoverTextColorClass = 'hover:text-[var(--color-shu)]';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsLangMenuOpen(false);
  }, [location]);

  // Close lang menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 transition-all duration-700 ${isScrolled ? 'bg-[var(--color-washi)]/60 backdrop-blur-lg py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-3 relative z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <BrandLogo
            className="gap-3"
            imageClassName="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
            textClassName={`text-base md:text-xl font-bold tracking-[0.16em] transition-colors ${textColorClass}`}
            subtextClassName="text-[9px] md:text-[10px] tracking-[0.25em] uppercase text-[var(--color-shu)]"
          />
        </Link>

        <div className="flex items-center gap-6 md:gap-10">
          <div className="hidden md:flex items-center gap-10">
            {!isOrderPage && (
              <>
                <a href="#menu" className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors ${textColorClass} ${hoverTextColorClass}`}>{t('nav.menu')}</a>
                <a href="#delivery" className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors ${textColorClass} ${hoverTextColorClass}`}>{t('nav.delivery')}</a>
                <Link to="/gallery" className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors ${textColorClass} ${hoverTextColorClass}`}>Gallery</Link>
              </>
            )}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors flex items-center gap-1 cursor-pointer ${textColorClass} ${hoverTextColorClass}`}
              >
                <Globe size={14} /> {i18n.language.toUpperCase()} <ChevronDown size={14} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-32 bg-[var(--color-washi)] shadow-lg border border-[var(--color-shu)]/40 py-2 z-50 rounded-sm"
                  >
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full text-left px-4 py-2 text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer ${i18n.language === 'en' ? 'text-[var(--color-shu)] bg-[var(--color-sumi)]/5' : 'text-[var(--color-sumi)] hover:bg-[var(--color-sumi)]/5'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('fi')}
                      className={`w-full text-left px-4 py-2 text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer ${i18n.language === 'fi' ? 'text-[var(--color-shu)] bg-[var(--color-sumi)]/5' : 'text-[var(--color-sumi)] hover:bg-[var(--color-sumi)]/5'}`}
                    >
                      Suomi
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isOrderPage && (
              <Link
                to="/order"
                className={`px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium transition-all bg-[var(--color-sumi)] text-[var(--color-washi)] hover:bg-[var(--color-shu)] hover:text-[var(--color-washi)]`}
              >
                {t('nav.orderNow')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle & Menu Icon */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => changeLanguage(i18n.language === 'en' ? 'fi' : 'en')}
              className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors flex items-center gap-1 cursor-pointer ${textColorClass} ${hoverTextColorClass}`}
            >
              <Globe size={14} /> {i18n.language.toUpperCase()}
            </button>
            {!isOrderPage && (
              <Link
                to="/order"
                className={`transition-colors cursor-pointer flex flex-col items-center ${textColorClass} ${hoverTextColorClass}`}
                title={t('nav.menu')}
              >
                <BrandLogo
                  showText={false}
                  className="gap-0"
                  imageClassName="h-6 w-6 object-contain"
                />
                <span className="text-[8px] uppercase tracking-tighter mt-0.5">{t('nav.menu')}</span>
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`transition-colors cursor-pointer ${textColorClass} ${hoverTextColorClass}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--color-washi)] flex flex-col items-center justify-center gap-8 p-6 md:hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(var(--color-sumi) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* Japanese Wave Pattern (Seigaiha) */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%232c2825' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}></div>

            {/* Large background Kanji */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0 select-none">
              <span className="text-[30rem] font-serif leading-none">和</span>
            </div>

            {/* Vertical Japanese text on sides */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none z-0 select-none">
              <div className="flex flex-col gap-8 text-2xl font-serif" style={{ writingMode: 'vertical-rl' }}>
                <span>おもてなしの心</span>
                <span>旬の味わい</span>
              </div>
            </div>

            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none z-0 select-none">
              <div className="flex flex-col gap-8 text-2xl font-serif" style={{ writingMode: 'vertical-rl' }}>
                <span>伝統と革新</span>
                <span>究極の旨味</span>
              </div>
            </div>

            {/* Red Hanko Stamp */}
            <div className="absolute bottom-12 right-12 w-20 h-20 border-2 border-[var(--color-shu)]/40 flex items-center justify-center rotate-12 opacity-60">
              <div className="w-16 h-16 border border-[var(--color-shu)]/40 flex items-center justify-center">
                <span className="text-[var(--color-shu)] font-serif text-2xl">旨味</span>
              </div>
            </div>

            {/* Minimalist Sun Illustration */}
            <div className="absolute top-24 left-12 w-16 h-16 rounded-full bg-[var(--color-shu)]/10 opacity-50 border border-[var(--color-shu)]/10"></div>

            <Link to="/" className="relative z-10 mb-8">
              <BrandLogo
                stacked
                imageClassName="h-20 w-20 object-contain"
                textClassName="text-2xl font-bold tracking-[0.14em] text-[var(--color-sumi)]"
                subtextClassName="text-xs tracking-[0.24em] uppercase text-[var(--color-shu)]"
              />
            </Link>

            <div className="flex flex-col items-center gap-8 relative z-10">
              {!isOrderPage ? (
                <>
                  <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors">Home {t('nav.menu')}</a>
                  <a href="#delivery" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors">{t('nav.delivery')}</a>
                  <Link to="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors">Gallery</Link>
                  <Link to="/order" onClick={() => setIsMobileMenuOpen(false)} className="text-xl tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors">Full {t('nav.menu')}</Link>
                </>
              ) : (
                <Link to="/" className="text-xl tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors">Home</Link>
              )}
              <Link
                to="/order"
                className="px-12 py-4 bg-[var(--color-sumi)] text-[var(--color-washi)] text-sm tracking-[0.2em] uppercase font-medium transition-all hover:bg-[var(--color-shu)]"
              >
                {t('nav.orderNow')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
