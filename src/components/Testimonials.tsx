import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TestimonialsColumn } from './ui/testimonials-columns-1';

export function Testimonials() {
  const { t } = useTranslation();

  const allTestimonials = [
    {
      text: t('testimonials.t1Text'),
      name: t('testimonials.t1Author'),
      role: t('testimonials.t1Role'),
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: t('testimonials.t2Text'),
      name: t('testimonials.t2Author'),
      role: t('testimonials.t2Role'),
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: t('testimonials.t3Text'),
      name: t('testimonials.t3Author'),
      role: t('testimonials.t3Role'),
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "The omakase experience here is unparalleled. Every dish tells a story of tradition and quality.",
      name: "Marcus Lindström",
      role: t('testimonials.t2Role'),
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "Best Poke bowls in the region. The fish is incredibly fresh and the toppings are perfectly balanced.",
      name: "Sofia Korhonen",
      role: t('testimonials.t3Role'),
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "A hidden gem for ramen lovers. The Tonkotsu broth has a depth of flavor that is hard to find.",
      name: "Jukka Niemi",
      role: t('testimonials.t2Role'),
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "Love the atmosphere and the friendly staff. It's our go-to spot for special weekend dinners.",
      name: "Elena Rossi",
      role: t('testimonials.t2Role'),
      image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "The delivery is always on time, and the sushi stays perfectly fresh. Highly impressed!",
      name: "Thomas Weber",
      role: t('testimonials.t2Role'),
      image: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&q=80"
    },
    {
      text: "Authentic flavors that stay true to Japanese tradition. The tempura is light and crispy.",
      name: "Yuki Tanaka",
      role: t('testimonials.t3Role'),
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80"
    }
  ];

  const firstColumn = allTestimonials.slice(0, 3);
  const secondColumn = allTestimonials.slice(3, 6);
  const thirdColumn = allTestimonials.slice(6, 9);

  return (
    <section className="bg-[var(--color-sumi)] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-washi) 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-2xl mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('testimonials.voices')}</p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-[var(--color-washi)] text-center">
            Guest <span className="italic font-light opacity-70">Experiences</span>
          </h2>
          <p className="text-center mt-6 text-[var(--color-washi)]/60 text-lg">
            See what our valued guests have to say about their journey through the 
            tastes of authentic Japanese cuisine.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={25} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={35} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={20} />
        </div>
      </div>
    </section>
  );
}
