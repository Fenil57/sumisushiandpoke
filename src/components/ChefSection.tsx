import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function ChefSection() {
  const { t } = useTranslation();

  const chefs = [
    {
      name: "Kenjiro Tanaka",
      role: t('chef.chef1Role'),
      exp: t('chef.chef1Exp'),
      desc: t('chef.chef1Desc'),
      img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Akira Sato",
      role: t('chef.chef2Role'),
      exp: t('chef.chef2Exp'),
      desc: t('chef.chef2Desc'),
      img: "https://images.unsplash.com/photo-1581182800629-7d90925ad072?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Hiroshi Watanabe",
      role: t('chef.chef3Role'),
      exp: t('chef.chef3Exp'),
      desc: t('chef.chef3Desc'),
      img: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-[var(--color-sumi)] text-[var(--color-washi)] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center mb-12 md:mb-20"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="w-12 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('chef.ourMasters')}</p>
            <span className="w-12 h-[1px] bg-[var(--color-shu)]"></span>
          </div>

          <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            {t('chef.theArtisans')} <br />
            <span className="italic font-light text-[var(--color-washi)]/70">{t('chef.behindKnife')}</span>
          </h2>

          <p className="text-[var(--color-washi)]/70 leading-relaxed font-light text-lg max-w-2xl mx-auto">
            {t('chef.desc')}
          </p>
        </motion.div>

        {/* Chefs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {chefs.map((chef, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="group flex flex-col"
            >
              <div className="aspect-[3/4] overflow-hidden relative mb-8">
                <img
                  src={chef.img}
                  alt={chef.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 border border-[var(--color-washi)]/20 m-4 pointer-events-none transition-all duration-500 group-hover:m-2"></div>

                {/* Floating Badge */}
                <div className="absolute bottom-0 left-0 bg-[var(--color-shu)] text-[var(--color-washi)] px-6 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <div className="text-xs tracking-[0.2em] uppercase font-bold">{chef.exp}</div>
                </div>
              </div>

              <h3 className="text-3xl font-serif font-bold mb-2 group-hover:text-[var(--color-shu)] transition-colors">{chef.name}</h3>
              <div className="text-xs tracking-[0.2em] uppercase text-[var(--color-washi)]/50 mb-4">{chef.role}</div>
              <p className="text-[var(--color-washi)]/70 font-light leading-relaxed">
                {chef.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
