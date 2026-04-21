import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { UtensilsCrossed, CalendarCheck, Phone } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

export function CTAStrip() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <section className="relative overflow-hidden bg-[var(--color-sumi)] py-24 md:py-32 px-4 md:px-6" aria-label="Call to action">
      {/* Decorative dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-washi) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Red accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-shu)]/5 blur-[120px] pointer-events-none" aria-hidden="true" />

      {/* Large watermark kanji */}
      <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none" aria-hidden="true">
        <span className="text-[20rem] md:text-[30rem] font-serif leading-none text-[var(--color-washi)]">
          予約
        </span>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Section tag */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]" />
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t("hero.authentic")}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-6xl font-serif font-bold tracking-tight text-[var(--color-washi)] mb-6">
            Ready to{" "}
            <span className="italic font-light opacity-80">Experience</span>
            <br className="hidden md:block" />{" "}
            Authentic Japanese Cuisine?
          </h2>

          <p className="text-[var(--color-washi)]/50 text-lg max-w-xl mx-auto mb-14 leading-relaxed">
            From hand-rolled sushi to simmering ramen, every dish is crafted
            with care and tradition. Order for delivery or join us at the table.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12">
            <Link
              to="/order"
              id="cta-order-online"
              className="group relative overflow-hidden w-full sm:w-auto px-12 py-5 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.3em] uppercase font-black transition-all shadow-[0_10px_30px_rgba(194,59,34,0.3)] hover:shadow-[0_15px_40px_rgba(194,59,34,0.4)] flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-[#a02020] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
              <UtensilsCrossed size={16} className="relative z-10" />
              <span className="relative z-10">{t("nav.orderNow")}</span>
            </Link>

            <Link
              to="/reservations"
              id="cta-reserve-table"
              className="group w-full sm:w-auto px-12 py-5 border border-[var(--color-washi)]/20 text-[var(--color-washi)] text-xs tracking-[0.3em] uppercase font-black transition-all hover:border-[var(--color-shu)] hover:text-[var(--color-shu)] hover:bg-[var(--color-shu)]/5 flex items-center justify-center gap-3"
            >
              <CalendarCheck size={16} />
              <span>{t("reservations.tag")}</span>
            </Link>
          </div>

          {/* Phone fallback */}
          <div className="flex items-center justify-center gap-3 text-[var(--color-washi)]/30">
            <Phone size={14} className="text-[var(--color-shu)]/60" />
            <span className="text-xs tracking-widest uppercase font-medium">
              {t("reservations.fallback")}{" "}
              <a
                href={`tel:${settings.contactPhone}`}
                className="text-[var(--color-shu)] hover:underline font-bold"
              >
                {settings.contactPhone}
              </a>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
