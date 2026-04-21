import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import KineticScrollGallery from "../components/ui/kinetic-scroll-gallery";
import { SEOHead } from "../components/SEOHead";

// Import local restaurant images
import rest1 from "../assets/images/restaurant/rest-1.webp";
import rest2 from "../assets/images/restaurant/rest-2.webp";
import rest3 from "../assets/images/restaurant/rest-3.webp";
import rest4 from "../assets/images/restaurant/rest-4.webp";
import rest5 from "../assets/images/restaurant/rest-5.webp";
import rest6 from "../assets/images/restaurant/rest-6.webp";
import rest7 from "../assets/images/restaurant/rest-7.webp";
import rest8 from "../assets/images/restaurant/rest-8.webp";
import rest9 from "../assets/images/restaurant/rest-9.webp";

export function Restaurant() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [displayLimit, setDisplayLimit] = React.useState(10);
  const ITEMS_PER_PAGE = 10;
  const loaderRef = React.useRef<HTMLDivElement>(null);

  // Array of local restaurant images
  const restaurantImages = [
    rest1,
    rest2,
    rest3,
    rest4,
    rest5,
    rest6,
    rest7,
    rest8,
    rest9,
  ];

  const paginatedImages = restaurantImages.slice(0, displayLimit);
  const hasMore = displayLimit < restaurantImages.length;

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayLimit((prev) => prev + ITEMS_PER_PAGE);
            setIsLoading(false);
          }, 600);
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, displayLimit]);

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6">
      <SEOHead
        title="Our Restaurant | Sumi Sushi & Poke – Photos & Atmosphere"
        description="Explore the atmosphere and handcrafted dishes at Sumi Sushi and Poke in Kaarina, Finland. View our restaurant gallery and experience authentic Japanese dining."
        canonicalPath="/restaurant"
      />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
              {t("restaurant.tag")}
            </p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-[var(--color-washi)] mb-4">
            {t("restaurant.title")}{" "}
            <span className="italic font-light opacity-70">
              {t("restaurant.titleItalic")}
            </span>
          </h1>
          <p className="text-[var(--color-washi)]/60 max-w-2xl mx-auto text-lg">
            {t("restaurant.subtitle")}
          </p>
        </motion.div>

        {/* Smooth Kinetic Scroll Gallery with local images */}
        <KineticScrollGallery images={paginatedImages} />

        {/* Infinite Scroll Trigger & Spinner */}
        {hasMore && (
          <div ref={loaderRef} className="mt-12 flex justify-center py-8">
            <div className="w-12 h-12 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isLoading && !hasMore && (
          <div className="mt-12 flex justify-center py-8">
            <div className="w-12 h-12 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="inline-block p-12 border border-[var(--color-washi)]/10 rounded-[3rem]">
            <p className="text-[var(--color-washi)]/80 text-xl font-serif italic mb-8">
              "{t("restaurant.quote")}"
            </p>
            <div className="bg-[var(--color-shu)] h-[1px] w-12 mx-auto"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
