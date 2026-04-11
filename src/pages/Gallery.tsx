import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getMenuItems, type MenuItem } from '../services/menuService';

interface GalleryImage {
  url: string;
  title: string;
  category: string;
}

const staticAtmosphere: GalleryImage[] = [
  {
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    title: "Restaurant Interior",
    category: "Atmosphere"
  },
  {
    url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200",
    title: "Cozy Dining",
    category: "Atmosphere"
  },
  {
    url: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=1200",
    title: "Traditional Setup",
    category: "Atmosphere"
  },
  {
    url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200",
    title: "Chef's Craft",
    category: "People"
  }
];

export function Gallery() {
  const { t } = useTranslation();
  const [images, setImages] = useState<GalleryImage[]>(staticAtmosphere);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCuisine() {
      try {
        const menuItems = await getMenuItems();
        
        // Filter out items that don't have images
        const cuisineImages: GalleryImage[] = menuItems
          .filter(item => item.image_url && item.image_url.trim() !== '')
          .map(item => ({
            url: item.image_url,
            title: item.name,
            category: "Cuisine"
          }));

        // Mix static and dynamic images
        // We put some atmosphere first, then some cuisine, then the rest
        const mixed: GalleryImage[] = [
          staticAtmosphere[0], // Interior
          ...cuisineImages.slice(0, 3), // First few menu items
          staticAtmosphere[1], // Cozy dining
          ...cuisineImages.slice(3, 7), // More menu items
          staticAtmosphere[2], // Traditional
          ...cuisineImages.slice(7), // Rest of menu
          staticAtmosphere[3] // Chef's craft
        ].filter(Boolean); // Filter in case cuisineImages is short

        setImages(mixed);
      } catch (error) {
        console.error("Failed to fetch gallery cuisine:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCuisine();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] pt-32 pb-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
            <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">{t('gallery.tag')}</p>
            <span className="w-8 h-[1px] bg-[var(--color-shu)]"></span>
          </div>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-[var(--color-washi)] mb-4">
            {t('gallery.title')} <span className="italic font-light opacity-70">{t('gallery.titleItalic')}</span>
          </h1>
          <p className="text-[var(--color-washi)]/60 max-w-2xl mx-auto text-lg">
            {t('gallery.subtitle')}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-white">
            {images.map((image, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#1a1a1a]"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 text-left">
                  <span className="text-[var(--color-shu)] text-xs tracking-widest uppercase mb-2 font-bold">
                    {t(`gallery.cat${image.category}`)}
                  </span>
                  <h3 className="text-[var(--color-washi)] text-2xl font-serif font-bold tracking-tight">
                    {image.title}
                  </h3>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 border border-[var(--color-washi)]/30 rounded-full flex items-center justify-center text-[var(--color-washi)]/50 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                  <span className="text-xs font-light">{(idx + 1).toString().padStart(2, '0')}</span>
                </div>
              </motion.div>
            ))}
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
              "{t('gallery.quote')}"
            </p>
            <div className="bg-[var(--color-shu)] h-[1px] w-12 mx-auto"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

