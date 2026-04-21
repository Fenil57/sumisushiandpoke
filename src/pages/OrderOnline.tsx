import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { getMenuItems, type MenuItem } from "../services/menuService";
import { useCart } from "../context/CartContext";
import { SEOHead } from "../components/SEOHead";

const RamenBowlIcon = ({
  className = "w-6 h-6",
  strokeWidth = 1.5,
}: {
  className?: string;
  strokeWidth?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 10h16v2a8 8 0 0 1-8 8 8 8 0 0 1-8-8v-2Z" />
    <path d="M4 10l16-4" />
    <path d="M12 10V5" />
    <path d="M8 10V6" />
    <path d="M16 10V7" />
  </svg>
);

// Fallback menu if Firestore is not configured or fails
const FALLBACK_MENU: MenuItem[] = [
  {
    id: "13-sake-maki",
    category: "Sushi",
    name: "Sake Maki (Salmon)",
    description: "Small rolls - 6 pcs.",
    price: 5.5,
    image_url:
      "https://images.unsplash.com/photo-1558985250-27a406d64cb3?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Popular"],
  },
  {
    id: "24-salmon-gl-maki",
    category: "Sushi",
    name: "Salmon GL Maki",
    description:
      "Salmon, avocado, cucumber, grilled salmon, unagi sauce, spring onion. Large roll - 8 pcs.",
    price: 11.9,
    image_url:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Chef's Choice"],
  },
  {
    id: "26-california-maki",
    category: "Sushi",
    name: "California Maki",
    description: "Surimi, avocado, cucumber, masago. Large roll - 8 pcs.",
    price: 9.9,
    image_url:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: [],
  },
  {
    id: "21-dragon-maki",
    category: "Sushi",
    name: "Dragon Maki",
    description: "Surimi, cucumber, avocado, salmon, tuna. Large roll - 8 pcs.",
    price: 11.9,
    image_url:
      "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Signature"],
  },
  {
    id: "poke-1",
    category: "Poke Bowls",
    name: "Raw Salmon Pesto Poke",
    description:
      "Sushi rice, salmon pesto, carrot, avocado, soya bean, mango, spring onion, house spicy mayo, eel sauce, sesame seeds.",
    price: 11.9,
    image_url:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Signature"],
  },
  {
    id: "wok-48",
    category: "Woks",
    name: "Chicken Devil",
    description:
      "Marinated chicken, onion, tomato, bell pepper, garlic, spring onion, coriander, leeks.",
    price: 13.9,
    image_url:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Spicy"],
  },
  {
    id: "1-gyoza",
    category: "Finger Foods",
    name: "Gyoza",
    description:
      "Fried chicken, vegetables, kimchi, choice of dip. Sizes: 5 pcs, 10 pcs, or 15 pcs.",
    price: 5.9,
    image_url:
      "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: ["Popular"],
  },
  {
    id: "3-fried-chicken",
    category: "Finger Foods",
    name: "Fried Chicken",
    description: "Choice of dip. Sizes: 5 pcs, 10 pcs, or 15 pcs.",
    price: 5.9,
    image_url:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    tags: [],
  },
];

export function OrderOnline() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAddedFromUrl = useRef(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  const ITEMS_PER_PAGE = 10;
  const loaderRef = useRef<HTMLDivElement>(null);

  const { addToCart, totalItems, totalPrice } = useCart();
  const isFallbackMenuEnabled = import.meta.env.DEV;

  const categories: string[] = [
    "All",
    ...new Set<string>(menuItems.map((item) => item.category)),
  ];

  const filteredMenu =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  // Load menu from Firestore
  useEffect(() => {
    async function loadMenu() {
      try {
        setIsLoadingMenu(true);
        setMenuLoadError(null);
        const items = await getMenuItems();
        if (items.length > 0) {
          setMenuItems(items);
        } else if (isFallbackMenuEnabled) {
          console.warn("No menu items in Firestore, using fallback menu");
          setMenuItems(FALLBACK_MENU);
        } else {
          setMenuItems([]);
          setMenuLoadError(t("order.menuUnavailableDesc"));
        }
      } catch (err: any) {
        if (isFallbackMenuEnabled) {
          console.warn(
            "Failed to load menu from Firestore, using fallback:",
            err.message,
          );
          setMenuItems(FALLBACK_MENU);
        } else {
          console.warn("Failed to load menu from Firestore:", err.message);
          setMenuItems([]);
          setMenuLoadError(t("order.menuUnavailableDesc"));
        }
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenu();
  }, [isFallbackMenuEnabled, t]);
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [activeCategory]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoadingMenu) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < filteredMenu.length) {
          setDisplayLimit((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [isLoadingMenu, filteredMenu.length, displayLimit]);

  // Handle adding item from URL query parameter
  useEffect(() => {
    if (isLoadingMenu || menuItems.length === 0 || hasAddedFromUrl.current)
      return;

    const params = new URLSearchParams(location.search);
    const itemId = params.get("addItem");

    if (itemId) {
      const itemToAdd = menuItems.find((item) => item.id === itemId);
      if (itemToAdd) {
        addToCart(itemToAdd);
        hasAddedFromUrl.current = true;

        // Clean the URL without reloading the page
        const newParams = new URLSearchParams(location.search);
        newParams.delete("addItem");
        const newSearch = newParams.toString();
        navigate(location.pathname + (newSearch ? `?${newSearch}` : ""), {
          replace: true,
        });
      }
    }
  }, [isLoadingMenu, menuItems, location.search, navigate, addToCart, location.pathname]);

  // Pagination/Infinite scroll logic
  const paginatedMenu = filteredMenu.slice(0, displayLimit);
  const hasMore = displayLimit < filteredMenu.length;

  const getCategoryTranslation = (cat: string) => {
    const translations: Record<string, string> = {
      All: t("order.categories.all"),
      Sushi: t("order.categories.sushi"),
      Woks: t("order.categories.woks"),
      "Finger Foods": t("order.categories.fingerFoods"),
      Drinks: t("order.categories.drinks"),
    };
    return translations[cat] || cat;
  };

  return (
    <div className="relative min-h-screen bg-[#fdfbf7] overflow-x-hidden">
      <SEOHead
        title="Order Online | Sumi Sushi & Poke – Delivery in Kaarina"
        description="Order fresh sushi, poke bowls, ramen, and wok dishes online for delivery or pickup from Sumi Sushi and Poke in Kaarina, Finland."
        canonicalPath="/order"
      />
      {/* Decorative background elements */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-sumi) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      <div className="fixed -left-10 md:-left-20 top-1/4 opacity-[0.03] md:opacity-[0.04] pointer-events-none z-0 select-none">
        <span className="text-[20rem] md:text-[40rem] font-serif leading-none">味</span>
      </div>

      <div className="fixed left-4 md:left-10 top-1/2 -translate-y-1/2 opacity-[0.05] md:opacity-[0.1] pointer-events-none z-0 select-none">
        <div
          className="flex flex-col gap-6 md:gap-12 text-xl md:text-4xl font-serif"
          style={{ writingMode: "vertical-rl" }}
        >
          <span>伝統の味を届ける</span>
          <span>旬の食材を活かす</span>
        </div>
      </div>

      <div className="fixed right-4 md:right-10 top-40 opacity-[0.03] md:opacity-[0.04] pointer-events-none z-0 select-none">
        <span
          className="text-[8rem] md:text-[15rem] font-serif leading-none"
          style={{ writingMode: "vertical-rl" }}
        >
          注文
        </span>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 h-64 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%232c2825' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
        }}
      ></div>

      {/* Floating Mobile Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 lg:hidden"
          >
            <button
              onClick={() => navigate("/cart")}
              className="w-full bg-[var(--color-shu)] text-[var(--color-washi)] py-4 px-6 shadow-2xl flex items-center justify-between group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <RamenBowlIcon className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-[var(--color-washi)] text-[var(--color-shu)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <span className="text-xs tracking-[0.2em] uppercase font-bold">
                  {t("order.yourOrder")}
                </span>
              </div>
              <span className="font-serif font-bold text-lg">
                €{totalPrice.toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto flex flex-col gap-6 lg:gap-10 relative z-10"
      >
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8 md:mb-16 border-b border-[var(--color-sumi)]/10 pb-8 relative"
          >
            <div className="absolute -left-4 top-2 w-1 h-12 bg-[var(--color-shu)] hidden md:block"></div>
            <h1 className="text-4xl md:text-7xl font-serif font-bold tracking-tight text-[var(--color-sumi)] mb-4">
              {t("order.title")}
            </h1>
            <p className="text-[var(--color-sumi)]/60 text-lg">
              {t("order.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex gap-8 mb-12 overflow-x-scroll pb-4 border-b border-[var(--color-sumi)]/10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-4 text-xs tracking-[0.2em] uppercase font-medium whitespace-nowrap transition-colors relative cursor-pointer ${
                  activeCategory === cat
                    ? "text-[var(--color-shu)]"
                    : "text-[var(--color-sumi)]/50 hover:text-[var(--color-sumi)]"
                }`}
              >
                {getCategoryTranslation(cat)}
                {activeCategory === cat && (
                  <motion.span
                    layoutId="activeCategoryIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--color-shu)]"
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Menu Grid */}
          {isLoadingMenu ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="border border-[var(--color-sumi)]/10 bg-white/70 p-8 md:p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-[var(--color-sumi)] mb-4">
                {t("order.menuUnavailableTitle")}
              </h2>
              <p className="text-[var(--color-sumi)]/65 leading-relaxed max-w-xl mx-auto">
                {menuLoadError || t("order.menuUnavailableDesc")}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12"
            >
              <AnimatePresence mode="popLayout">
                {paginatedMenu.map((item, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    key={item.id}
                    className="group flex flex-col sm:flex-row gap-6 p-4 -mx-4 hover:bg-[var(--color-sumi)]/[0.02] transition-colors relative"
                  >
                    {/* Decorative corner accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--color-shu)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[var(--color-shu)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="w-full sm:w-36 h-48 sm:h-36 overflow-hidden shrink-0 relative shadow-sm">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[var(--color-sumi)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Decorative corner stamp on image */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-[var(--color-shu)]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span
                          className="text-[var(--color-shu)] text-[8px] font-serif leading-none"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          厳選
                        </span>
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-[var(--color-shu)] text-[var(--color-washi)] text-[9px] uppercase tracking-widest px-2 py-1 font-bold shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <h3 className="font-serif font-bold text-xl text-[var(--color-sumi)] group-hover:text-[var(--color-shu)] transition-colors">
                            {item.name}
                          </h3>
                          <span className="font-medium text-[var(--color-sumi)]/80 whitespace-nowrap border-b border-[var(--color-sumi)]/10 pb-1">
                            €{item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-sumi)]/60 line-clamp-2 leading-relaxed mb-4">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="self-start mt-auto text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors flex items-center gap-2 group/btn cursor-pointer"
                      >
                        <span className="w-6 h-[1px] bg-current transition-all duration-300 group-hover/btn:w-10"></span>{" "}
                        {t("order.addToOrder")}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Infinite Scroll Trigger & Spinner */}
          {!isLoadingMenu && hasMore && (
            <div ref={loaderRef} className="mt-16 flex justify-center py-8">
              <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
