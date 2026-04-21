import React from "react";
import logoImage from "../assets/images/logo.png";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  subtextClassName?: string;
  stacked?: boolean;
  showText?: boolean;
}

export function BrandLogo({
  className = "",
  imageClassName = "h-12 w-12 object-contain",
  textClassName = "text-xl font-bold tracking-[0.18em]",
  subtextClassName = "text-[10px] tracking-[0.3em] uppercase text-[var(--color-shu)]",
  stacked = false,
  showText = true,
}: BrandLogoProps) {
  return (
    <div
      className={`flex ${stacked ? "flex-col items-center text-center" : "items-center"} gap-3 ${className}`}
    >
      <img
        src={logoImage}
        alt="Sumi Sushi and Poke logo"
        className={imageClassName}
      />
      {showText && (
        <div
          className={
            stacked ? "flex flex-col items-center gap-1" : "flex flex-col"
          }
        >
          <span className={`whitespace-nowrap ${textClassName}`}>
            SUMI SUSHI AND POKE
          </span>
          <span className={subtextClassName}>Authentic Taste</span>
        </div>
      )}
    </div>
  );
}
