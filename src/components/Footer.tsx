import React from "react";
import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const socialLinks = [
    {
      href: settings.instagramUrl,
      label: "Instagram",
      icon: <Instagram size={20} />,
    },
    /*
    {
      href: settings.facebookUrl,
      label: "Facebook",
      icon: <Facebook size={20} />,
    },
    {
      href: settings.twitterUrl,
      label: "Twitter",
      icon: <Twitter size={20} />,
    },
    */
  ];

  const hoursRows = [
    {
      label: t("footer.days1"),
      hours: settings.weekdayHours,
      buffetHours: settings.weekdayBuffetHours,
      buffetPrice: settings.weekdayBuffetPrice,
    },
    {
      label: t("footer.days2"),
      hours: settings.saturdayHours,
      buffetHours: settings.saturdayBuffetHours,
      buffetPrice: settings.saturdayBuffetPrice,
    },
    {
      label: t("footer.days3"),
      hours: settings.sundayHours,
      buffetHours: settings.sundayBuffetHours,
      buffetPrice: settings.sundayBuffetPrice,
    },
  ];

  const renderPolicyLink = (
    href: string,
    label: string,
    fallbackPath: string,
  ) => {
    const resolvedHref = href?.trim() || fallbackPath;

    if (resolvedHref.startsWith("/")) {
      return (
        <Link
          to={resolvedHref}
          className="hover:text-[#f9f6f0] transition-colors cursor-pointer"
        >
          {label}
        </Link>
      );
    }

    return (
      <a
        href={resolvedHref}
        target="_blank"
        rel="noreferrer"
        className="hover:text-[#f9f6f0] transition-colors cursor-pointer"
      >
        {label}
      </a>
    );
  };

  return (
    <footer className="relative bg-[#1c1c1c] text-[var(--color-washi)] overflow-hidden group" itemScope itemType="https://schema.org/Restaurant" aria-label="Site footer">
      <div className="absolute inset-0 z-0 overflow-hidden opacity-25 grayscale" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000"
          alt=""
          role="presentation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-neutral-900/40" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-24 pb-8 md:pt-32 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-24">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-6 block">
              <BrandLogo
                imageClassName="h-14 w-14 object-contain"
                textClassName="text-base font-bold tracking-[0.14em] text-[var(--color-washi)]"
                subtextClassName="text-[10px] tracking-[0.22em] uppercase text-[var(--color-shu)]"
              />
            </Link>
            <p className="text-sm text-[var(--color-washi)]/60 leading-relaxed mb-6 max-w-[250px]">
              {settings.subtitle}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-washi)]/40 hover:text-[var(--color-shu)] transition-colors"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </a>
                ) : (
                  <span
                    key={link.label}
                    className="text-[var(--color-washi)]/20 cursor-not-allowed"
                    aria-label={`${link.label} not configured`}
                  >
                    {link.icon}
                  </span>
                ),
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] uppercase mb-6">
              {t("footer.contact")}
            </h4>
            <address className="not-italic" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <ul className="space-y-4 text-sm text-[var(--color-washi)]/60">
                <li className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--color-shu)]"
                  />
                  <span className="leading-relaxed whitespace-pre-line" itemProp="streetAddress">
                    {settings.address}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="shrink-0 text-[var(--color-shu)]" />
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                    itemProp="telephone"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-[var(--color-shu)]" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                    itemProp="email"
                  >
                    {settings.contactEmail}
                  </a>
                </li>
              </ul>
            </address>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--color-washi)] mb-6">
              {t("footer.explore")}
            </h4>
            <ul className="space-y-4 text-sm text-[var(--color-washi)]/60">
              <li>
                <a
                  href="#menu"
                  className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                >
                  {t("footer.ourMenu")}
                </a>
              </li>
              <li>
                <Link
                  to="/restaurant"
                  className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                >
                  {t("restaurant.tag")}
                </Link>
              </li>
              <li>
                <Link
                  to="/reservations"
                  className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                >
                  {t("reservations.tag")}
                </Link>
              </li>
              <li>
                <Link
                  to="/order"
                  className="hover:text-[var(--color-shu)] transition-colors cursor-pointer"
                >
                  {t("footer.orderOnline")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--color-washi)] mb-6">
              {t("footer.hours")}
            </h4>
            <ul className="space-y-4 text-sm text-[var(--color-washi)]/60">
              {hoursRows.map((row) => (
                <li key={row.label} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[var(--color-washi)]/80 font-medium">
                    <span className="uppercase tracking-widest text-xs">
                      {row.label}
                    </span>
                    <span>{row.hours}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--color-washi)]/40 tracking-wider">
                    <span>
                      ( {t("footer.buffet").toUpperCase()} {row.buffetHours} )
                    </span>
                    <span>EUR {row.buffetPrice.toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-xs tracking-widest uppercase text-[#f9f6f0]/40 border-t border-[#f9f6f0]/10">
          <p>
            (c) {new Date().getFullYear()} {t("footer.rights")}
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            {renderPolicyLink(
              settings.privacyPolicyUrl,
              t("footer.privacy"),
              "/privacy",
            )}
            {renderPolicyLink(settings.termsUrl, t("footer.terms"), "/terms")}
          </div>
        </div>
      </div>
    </footer>
  );
}
