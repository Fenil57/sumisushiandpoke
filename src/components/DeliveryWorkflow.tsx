import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function DeliveryWorkflow() {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      kanji: '注文',
      title: t('delivery.step1Title'),
      desc: t('delivery.step1Desc')
    },
    {
      num: '02',
      kanji: '準備',
      title: t('delivery.step2Title'),
      desc: t('delivery.step2Desc')
    },
    {
      num: '03',
      kanji: '芸術',
      title: t('delivery.step3Title'),
      desc: t('delivery.step3Desc')
    },
    {
      num: '04',
      kanji: '配達',
      title: t('delivery.step4Title'),
      desc: t('delivery.step4Desc')
    },
    {
      num: '05',
      kanji: '到着',
      title: t('delivery.step5Title'),
      desc: t('delivery.step5Desc')
    },
  ];

  return (
    <section id="delivery" className="py-16 md:py-32 px-4 md:px-6 bg-[var(--color-washi)] text-[var(--color-sumi)] relative">

      {/* Artistic Japanese Illustration Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">

        {/* Vertical Japanese Typography */}
        <div className="absolute top-0 left-4 md:left-12 bottom-0 flex items-center">
          <div className="vertical-text text-[8rem] md:text-[15rem] font-serif font-bold text-[var(--color-sumi)] opacity-[0.08] whitespace-nowrap select-none">
            最高品質へのこだわり
          </div>
        </div>

        {/* The Red Sun (Hinomaru) */}
        <div className="absolute top-[2%] right-[2%] md:top-[5%] md:right-[5%] w-[15rem] h-[15rem] md:w-[25rem] md:h-[25rem] rounded-full bg-[var(--color-shu)] opacity-[0.15]" />

        {/* Flock of Birds */}
        <svg className="absolute top-[8%] right-[10%] md:top-[12%] md:right-[15%] w-24 h-24 md:w-32 md:h-32 opacity-[0.3] text-[var(--color-sumi)]" viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,50 Q20,40 30,50 Q20,45 10,50 Z M30,50 Q40,40 50,50 Q40,45 30,50 Z" />
          <path d="M40,30 Q50,20 60,30 Q50,25 40,30 Z M60,30 Q70,20 80,30 Q70,25 60,30 Z" />
          <path d="M60,60 Q70,50 80,60 Q70,55 60,60 Z M80,60 Q90,50 100,60 Q90,55 80,60 Z" />
        </svg>

        {/* Hanko Stamp */}
        <div className="absolute top-[15%] right-[15%] md:top-[20%] md:right-[22%] opacity-100 flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 border-2 border-[var(--color-shu)] text-[var(--color-shu)] rounded-sm rotate-12">
          <span className="font-serif text-2xl md:text-3xl font-bold leading-none">旨</span>
          <span className="font-serif text-2xl md:text-3xl font-bold leading-none">味</span>
        </div>

        {/* Sweeping Ink Mountains / Waves (Bottom) */}
        <svg className="absolute bottom-0 left-0 w-full h-[40%] md:h-[60%] opacity-[0.12] text-[var(--color-sumi)]" preserveAspectRatio="none" viewBox="0 0 1000 400" fill="currentColor">
          <path d="M0,400 L0,200 C150,300 350,150 500,200 C650,250 850,150 1000,200 L1000,400 Z" />
          <path d="M0,400 L0,250 C200,350 400,200 600,250 C800,300 900,200 1000,250 L1000,400 Z" opacity="0.6" />
          <path d="M0,400 L0,300 C250,400 450,250 700,300 C850,350 950,250 1000,300 L1000,400 Z" opacity="0.3" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-24"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('delivery.process')}</p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
            {t('delivery.fromKitchen')} <span className="italic font-light text-[var(--color-sumi)]/70">{t('delivery.yourTable')}</span>
          </h2>
        </motion.div>

        <div className="relative pb-16 md:pb-32">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="sticky rounded-[2rem] p-6 md:p-16 mb-8 min-h-[280px] md:min-h-[320px] flex flex-col justify-end shadow-2xl transition-transform overflow-hidden group"
              style={{
                top: `${120 + idx * 24}px`,
                backgroundColor: idx % 2 === 0 ? 'var(--color-sumi)' : 'var(--color-washi)',
                color: idx % 2 === 0 ? 'var(--color-washi)' : 'var(--color-sumi)',
                zIndex: idx + 1
              }}
            >
              {/* Giant Kanji Watermark */}
              <div className={`absolute -bottom-8 -right-8 text-[10rem] md:text-[14rem] font-serif leading-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none select-none ${idx % 2 === 0 ? 'text-[var(--color-washi)]' : 'text-[var(--color-sumi)]'}`}>
                {step.kanji}
              </div>

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--color-shu)]">
                  Step {step.num}
                </div>
              </div>

              <h3 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-6 relative z-10">{step.title}</h3>
              <p className={`text-lg leading-relaxed max-w-xl relative z-10 ${idx % 2 === 0 ? 'text-[var(--color-washi)]/70' : 'text-[var(--color-sumi)]/70'}`}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
