import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import KineticScrollGallery from '../components/ui/kinetic-scroll-gallery';

// Import local restaurant images
import rest1 from '../assets/images/restaurant/rest-1.jpeg';
import rest2 from '../assets/images/restaurant/rest-2.jpeg';
import rest3 from '../assets/images/restaurant/rest-3.jpeg';
import rest4 from '../assets/images/restaurant/rest-4.jpeg';
import rest5 from '../assets/images/restaurant/rest-5.jpeg';
import rest6 from '../assets/images/restaurant/rest-6.jpeg';
import rest7 from '../assets/images/restaurant/rest-7.jpeg';

export function Restaurant() {
  const { t } = useTranslation();
  
  // Array of local restaurant images
  const restaurantImages = [
    rest1, rest2, rest3, rest4, rest5, rest6, rest7
  ];

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('restaurant.tag')}</p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-[var(--color-washi)] mb-4">
            {t('restaurant.title')} <span className="italic font-light opacity-70">{t('restaurant.titleItalic')}</span>
          </h1>
          <p className="text-[var(--color-washi)]/60 max-w-2xl mx-auto text-lg">
            {t('restaurant.subtitle')}
          </p>
        </motion.div>

        {/* Smooth Kinetic Scroll Gallery with local images */}
        <KineticScrollGallery images={restaurantImages} />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-block p-12 border border-[var(--color-washi)]/10 rounded-[3rem]">
            <p className="text-[var(--color-washi)]/80 text-xl font-serif italic mb-8">
              "{t('restaurant.quote')}"
            </p>
            <div className="bg-[var(--color-shu)] h-[1px] w-12 mx-auto"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
