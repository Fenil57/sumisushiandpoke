import React, { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { TestimonialCard } from "./ui/testimonial-cards";

export function Testimonials() {
  const { t } = useTranslation();
  const [positions, setPositions] = useState(["front", "middle", "back"]);

  const testimonials = [
    {
      id: 1,
      testimonial: t("testimonials.t1Text"),
      author: t("testimonials.t1Author"),
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 2,
      testimonial: t("testimonials.t2Text"),
      author: t("testimonials.t2Author"),
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    },
    {
      id: 3,
      testimonial: t("testimonials.t3Text"),
      author: t("testimonials.t3Author"),
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    },
  ];

  const handleShuffle = () => {
    setPositions((prev) => {
      const newPositions = [...prev];
      const last = newPositions.pop()!;
      newPositions.unshift(last);
      return newPositions;
    });
  };

  return (
    <section className="pb-24 md:pb-32 px-4 md:px-6 bg-[var(--color-sumi)] text-[var(--color-washi)] relative overflow-hidden flex flex-col items-center">
      {/* Decorative background element */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-washi) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      ></div>

      <div className="max-w-5xl mx-auto relative z-10 w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t("testimonials.voices")}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
            Guest{" "}
            <span className="italic font-light opacity-70">Experiences</span>
          </h2>
        </motion.div>

        {/* Shuffle Card Container */}
        <div className="relative h-[450px] w-[280px] md:w-[350px] mx-auto md:ml-[calc(50%-175px)]">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              {...testimonial}
              handleShuffle={handleShuffle}
              position={positions[index]}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 text-xs tracking-[0.3em] uppercase text-[var(--color-washi)]/40 animate-pulse"
        >
          Drag the card left to shuffle
        </motion.p>
      </div>
    </section>
  );
}
