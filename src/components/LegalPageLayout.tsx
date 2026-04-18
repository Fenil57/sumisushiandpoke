import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalPageLayout({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
}: LegalPageLayoutProps) {
  const { settings } = useSettings();

  return (
    <div className="relative min-h-screen bg-[#fdfbf7] pt-28 md:pt-36 pb-16 md:pb-24 px-4 md:px-6">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-sumi) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)]/50 hover:text-[var(--color-shu)] transition-colors mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Home
        </Link>

        <div className="mb-10 border-b border-[var(--color-sumi)]/10 pb-8">
          <p className="text-xs tracking-[0.35em] uppercase text-[var(--color-shu)] font-bold mb-4">
            {eyebrow}
          </p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-[var(--color-sumi)] mb-4">
            {title}
          </h1>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-sumi)]/35 mb-6">
            Last updated {updatedAt}
          </p>
          <p className="text-base md:text-lg leading-relaxed text-[var(--color-sumi)]/70 max-w-3xl">
            {intro}
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="bg-white/70 border border-[var(--color-sumi)]/10 p-6 md:p-8 shadow-sm"
            >
              <h2 className="text-2xl font-serif font-bold text-[var(--color-sumi)] mb-4">
                {section.title}
              </h2>
              <div className="space-y-4 text-[var(--color-sumi)]/70 leading-relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-[var(--color-sumi)] text-[var(--color-washi)] p-6 md:p-8">
          <p className="text-xs tracking-[0.25em] uppercase text-[var(--color-shu)] mb-3">
            Contact
          </p>
          <p className="text-lg font-serif font-bold mb-2">
            {settings.restaurantName}
          </p>
          <p className="text-sm text-[var(--color-washi)]/75 whitespace-pre-line">
            {settings.address}
          </p>
          <p className="text-sm text-[var(--color-washi)]/75 mt-3">
            {settings.contactEmail} | {settings.contactPhone}
          </p>
          <p className="text-xs text-[var(--color-washi)]/45 mt-4">
            This page is provided for launch readiness and business transparency.
            It is not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
