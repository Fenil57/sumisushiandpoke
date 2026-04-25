import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  getDefaultMenuItemVariation,
  getMenuItemPriceRange,
  getMenuItems,
  type MenuItem,
} from "../services/menuService";
import { useCart } from "../context/CartContext";



function pickFeaturedItems(items: MenuItem[]): MenuItem[] {
  // Primarily use the explicit is_featured flag
  const explicitlyFeatured = items.filter(item => item.is_featured);
  
  if (explicitlyFeatured.length > 0) {
    return explicitlyFeatured.slice(0, 5);
  }

  // Fallback to the old tag-based logic if no items are explicitly featured yet
  const featuredTags = new Set(["popular", "signature", "chef's choice"]);
  const taggedItems = items.filter((item) =>
    (item.tags || []).some((tag) => featuredTags.has(tag.toLowerCase())),
  );
  const remainingItems = items.filter(
    (item) => !taggedItems.some((taggedItem) => taggedItem.id === item.id),
  );

  return [...taggedItems, ...remainingItems].slice(0, 5);
}

export function MenuScroll() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { addToCart, cart } = useCart();

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, getDefaultMenuItemVariation(item));
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 2000);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedItems() {
      try {
        const items = await getMenuItems();
        if (!isMounted || items.length === 0) return;
        setFeaturedItems(pickFeaturedItems(items));
      } catch (err) {
        console.error("Failed to load featured items:", err);
      }
    }

    loadFeaturedItems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="menu"
      className="py-16 md:py-32 px-4 md:px-6 bg-[var(--color-sumi)] text-[var(--color-washi)]"
      aria-label="Featured menu items"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center mb-8 md:mb-16 border-b border-[var(--color-washi)]/20 pb-8">
          <div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="w-12 h-[1px] bg-[var(--color-shu)]"></span>
              <p className="text-xs tracking-[0.4em] uppercase font-medium text-[var(--color-shu)]">
                {t("menu.featured")}
              </p>
              <span className="w-12 h-[1px] bg-[var(--color-shu)]"></span>
            </div>
            <p className="text-4xl md:text-7xl font-serif font-bold tracking-tight text-[var(--color-washi)]">
              {t("menu.crafted")} <br />
              <span className="italic font-light text-[var(--color-washi)]/70">
                {t("menu.precision")}
              </span>
            </p>
          </div>
          <Link
            to="/order"
            className="mt-8 text-xs tracking-[0.2em] uppercase font-medium border-b border-[var(--color-washi)] pb-1 hover:text-[var(--color-shu)] hover:border-[var(--color-shu)] transition-colors text-[var(--color-washi)] cursor-pointer"
          >
            {t("menu.viewFull")}
          </Link>
        </div>

        <div className="flex flex-col md:flex-row h-[70vh] min-h-[600px] w-full gap-2 md:gap-4">
          {featuredItems.map((item, idx) => {
            const isActive = activeIndex === idx;
            const isAdded = addedItemId === item.id;
            const defaultVariation = getDefaultMenuItemVariation(item);
            const cartItem = cart.find((i) => i.item.id === item.id && i.variation.id === defaultVariation.id);
            const isInCart = !!cartItem;
            const cartQuantity = cartItem?.quantity || 0;
            return (
              <motion.div
                key={item.id}
                className="relative overflow-hidden cursor-pointer group rounded-sm"
                animate={{
                  flex: isActive ? 5 : 2,
                }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-sumi)] flex items-center justify-center text-[#f9f6f0]/20">
                    <span className="font-serif text-5xl tracking-[0.2em]">SUMI</span>
                  </div>
                )}

                <div
                  className={`absolute inset-0 bg-gradient-to-t from-[#1c1c1c]/90 via-[#1c1c1c]/20 to-transparent transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-60"}`}
                />

                <div className="absolute inset-0 flex flex-col">
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="flex flex-col h-full justify-end p-6 md:p-8"
                      >
                        <div className="text-[#c92a2a] text-sm font-medium tracking-widest mb-3" aria-hidden="true">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h3 className="text-3xl md:text-5xl text-[#f9f6f0] font-serif font-bold mb-4">
                          {item.name}
                        </h3>
                        <p className="text-[#f9f6f0]/80 text-sm max-w-md leading-relaxed mb-6 hidden md:block">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#f9f6f0]/20">
                          <span className="text-xl md:text-2xl text-[#f9f6f0] font-medium">
                            {getMenuItemPriceRange(item)}
                          </span>
                          <button
                            onClick={(e) => handleAddToCart(e, item)}
                            aria-label={`Add ${item.name} to cart`}
                            className={`text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium transition-colors flex items-center gap-2 cursor-pointer ${isAdded || isInCart ? 'text-[var(--color-shu)]' : 'text-[#f9f6f0] hover:text-[#c92a2a]'}`}
                          >
                            <span className="w-4 md:w-8 h-[1px] bg-current" aria-hidden="true"></span>{" "}
                            {isAdded || isInCart ? "Added!" : t("menu.orderNow")}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="inactive"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center md:items-start md:justify-center h-full p-4 md:py-8 md:px-2"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-[#f9f6f0]/50 text-xs font-medium tracking-widest mb-2 md:mb-4" aria-hidden="true">
                            {String(idx + 1).padStart(2, "0")}
                          </div>
                          <h3 className="text-xl md:text-2xl text-[#f9f6f0] font-serif font-bold md:[writing-mode:vertical-rl] md:rotate-180 whitespace-nowrap">
                            {item.name}
                          </h3>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
