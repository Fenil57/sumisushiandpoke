import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { getMenuItems, type MenuItem } from "../services/menuService";

const fallbackItems: MenuItem[] = [
  {
    id: "dragon-maki",
    name: "Dragon Maki",
    description:
      "Surimi, cucumber, avocado, salmon, tuna. Large roll - 8 pcs.",
    price: 11.9,
    category: "Sushi",
    image_url:
      "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80",
    is_available: true,
  },
  {
    id: "salmon-gl-maki",
    name: "Salmon GL Maki",
    description:
      "Salmon, avocado, cucumber, grilled salmon, unagi sauce, spring onion.",
    price: 11.9,
    category: "Sushi",
    image_url:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80",
    is_available: true,
  },
  {
    id: "raw-salmon-pesto-poke",
    name: "Raw Salmon Pesto Poke",
    description:
      "Sushi rice, salmon pesto, carrot, avocado, edamame, mango, spicy mayo, eel sauce.",
    price: 11.9,
    category: "Poke Bowls",
    image_url:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    is_available: true,
  },
  {
    id: "gyoza",
    name: "Gyoza",
    description:
      "Fried chicken, vegetables, kimchi, choice of dip. Sizes: 5 pcs, 10 pcs, or 15 pcs.",
    price: 5.9,
    category: "Finger Foods",
    image_url:
      "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    is_available: true,
  },
  {
    id: "chicken-devil",
    name: "Chicken Devil",
    description:
      "Marinated chicken, onion, tomato, bell pepper, garlic, spring onion, coriander, leeks.",
    price: 13.9,
    category: "Woks",
    image_url:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    is_available: true,
  },
];

function pickFeaturedItems(items: MenuItem[]): MenuItem[] {
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
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>(fallbackItems);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedItems() {
      try {
        const items = await getMenuItems();
        if (!isMounted || items.length === 0) return;
        setFeaturedItems(pickFeaturedItems(items));
      } catch {
        // Keep the homepage usable if Firestore is unavailable.
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
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />

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
                        <div className="text-[#c92a2a] text-sm font-medium tracking-widest mb-3">
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
                            EUR {item.price.toFixed(2)}
                          </span>
                          <Link
                            to={`/order?addItem=${item.id}`}
                            className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium text-[#f9f6f0] hover:text-[#c92a2a] transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <span className="w-4 md:w-8 h-[1px] bg-current"></span>{" "}
                            {t("menu.orderNow")}
                          </Link>
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
                          <div className="text-[#f9f6f0]/50 text-xs font-medium tracking-widest mb-2 md:mb-4">
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
