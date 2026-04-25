import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { TestimonialsColumn } from "./ui/testimonials-columns-1";

export function Testimonials() {
  const { t } = useTranslation();

  const reviews = [
    {
      text: "Good sushi. The environment is also friendly and cosy",
      name: "Gucci Nguyen",
      role: "Guest",
    },
    {
      text: "I had a great experience at Sumi Sushi and Poke. The sushi tasted fresh and well-made, and the poke bowl had a really nice balance of flavors. The portions were good and the service was friendly and fast. The place feels new and clean.",
      name: "Jenish Savaliya",
      role: "Guest",
    },
    {
      text: "Very good and tasty poke bowl! Worth to try",
      name: "roosa aaltonen",
      role: "Guest",
    },
    {
      text: "We stopped by to check out a new place. The Poke bowls were big, protein-rich and delicious. The tofu bowl also had a good sauce and a pickle. And very friendly service.",
      name: "Katerina Saltychev",
      role: "Guest",
    },
    {
      text: "The food was good, but special mention for the friendly service!",
      name: "A S",
      role: "Guest",
    },
    {
      text: "Nice, personal atmosphere and a very good poke bowl on top. I recommend it.",
      name: "Juho Sillantie",
      role: "Guest",
    },
  ];

  const firstColumn = [reviews[0], reviews[1], reviews[4], reviews[5]];
  const secondColumn = [reviews[2], reviews[3], reviews[0], reviews[1]];
  const thirdColumn = [reviews[4], reviews[5], reviews[2], reviews[3]];

  return (
    <section className="bg-[var(--color-sumi)] pb-24 md:pb-32 relative overflow-hidden" aria-label="Guest testimonials">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-washi) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      ></div>

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
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t("testimonials.voices")}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-[var(--color-washi)] text-center">
            Guest{" "}
            <span className="italic font-light opacity-70">Experiences</span>
          </h2>
          <p className="text-center mt-6 text-[var(--color-washi)]/60 text-lg">
            See what our valued guests have to say about their journey through
            the tastes of authentic Japanese cuisine.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={25} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={35}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={20}
          />
        </div>
      </div>
    </section>
  );
}
