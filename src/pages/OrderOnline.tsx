import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  getDefaultMenuItemVariation,
  getMenuItemPriceRange,
  getMenuItemVariations,
  getMenuItems,
  getMenuCustomizationGroups,
  hasMenuCustomizations,
  calculateCustomizationPrice,
  translateCustomizationText,
  translateItemName,
  type MenuItem,
  type MenuItemVariation,
  type MenuCustomizationSelection,
  DEFAULT_FOOD_IMAGE,
} from "../services/menuService";
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

const MENU_SKELETON_COUNT = 9;
const MOBILE_DESCRIPTION_PREVIEW_LENGTH = 90;
const DESKTOP_DESCRIPTION_PREVIEW_LENGTH = 56;

function getDescriptionPreview(text: string, previewLength: number) {
  const trimmedText = text.trim();

  if (trimmedText.length <= previewLength) return trimmedText;

  const preview = trimmedText.slice(0, previewLength).trim();
  const lastSpaceIndex = preview.lastIndexOf(" ");

  return lastSpaceIndex > 0 ? preview.slice(0, lastSpaceIndex) : preview;
}

function MenuItemSkeleton() {
  return (
    <div className="group flex flex-col sm:flex-row gap-6 p-4 -mx-4 relative animate-pulse">
      <div className="w-full sm:w-36 h-48 sm:h-36 shrink-0 bg-[var(--color-sumi)]/5" />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start mb-3 gap-4">
            <div className="h-7 w-2/3 bg-[var(--color-sumi)]/10" />
            <div className="h-6 w-16 bg-[var(--color-sumi)]/10" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-[var(--color-sumi)]/10" />
            <div className="h-4 w-4/5 bg-[var(--color-sumi)]/10" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-px w-6 bg-[var(--color-sumi)]/20" />
          <div className="h-4 w-28 bg-[var(--color-sumi)]/10" />
        </div>
      </div>
    </div>
  );
}

interface MenuDescriptionProps {
  text?: string;
}

function MenuDescription({ text }: MenuDescriptionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewLength, setPreviewLength] = useState(
    MOBILE_DESCRIPTION_PREVIEW_LENGTH,
  );

  const descriptionText = (text || "").trim();
  const isTruncatable = descriptionText.length > previewLength;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const updatePreviewLength = () => {
      setPreviewLength(
        mediaQuery.matches
          ? DESKTOP_DESCRIPTION_PREVIEW_LENGTH
          : MOBILE_DESCRIPTION_PREVIEW_LENGTH,
      );
    };

    updatePreviewLength();
    mediaQuery.addEventListener("change", updatePreviewLength);

    return () => {
      mediaQuery.removeEventListener("change", updatePreviewLength);
    };
  }, []);

  if (!descriptionText) return null;

  if (!isTruncatable) {
    return (
      <p className="text-sm text-[var(--color-sumi)]/60 leading-6 mb-4">
        {descriptionText}
      </p>
    );
  }

  const previewText = getDescriptionPreview(descriptionText, previewLength);

  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`mb-4 text-sm text-[var(--color-sumi)]/60 leading-6 ${
        isExpanded ? "" : "line-clamp-2"
      }`}
    >
      <span>{isExpanded ? descriptionText : `${previewText}...`}</span>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="font-bold text-[var(--color-shu)] ml-1.5 hover:underline cursor-pointer inline align-baseline"
      >
        {isExpanded ? t("menu.showLess") : t("menu.readMore")}
      </button>
    </motion.div>
  );
}

// ─── CustomizationModal ─────────────────────────────────────────────
interface CustomizationModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (
    item: MenuItem,
    variation: MenuItemVariation,
    selections: MenuCustomizationSelection[],
    quantity: number,
  ) => void;
}

function CustomizationModal({ item, onClose, onAdd }: CustomizationModalProps) {
  const { t, i18n } = useTranslation();
  const groups = getMenuCustomizationGroups(item);
  const variations = getMenuItemVariations(item);
  const [selectedVariationId, setSelectedVariationId] = useState(variations[0].id);
  const [quantity, setQuantity] = useState(1);

  // Initialize selections with defaults or fallback to first option(s) for required groups
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of groups) {
      const defaults = group.default_option_ids;
      let selected: string[] = [];
      if (defaults && defaults.length > 0) {
        selected = defaults.filter(
          (id) => group.options.some((opt) => opt.id === id),
        );
      }
      
      // Fallback: if no valid defaults but the group is required (min_select > 0)
      if (selected.length === 0 && (group.min_select || 0) > 0 && group.options.length > 0) {
        const numToSelect = Math.min(group.min_select || 1, group.options.length);
        selected = group.options.slice(0, numToSelect).map((opt) => opt.id);
      }
      
      if (selected.length > 0) {
        initial[group.id] = selected.slice(0, group.max_select);
      }
    }
    return initial;
  });

  const selectedVariation =
    variations.find((v) => v.id === selectedVariationId) || variations[0];
  const selectionPayload = groups.map((g) => ({
    group_id: g.id,
    option_ids: selections[g.id] || [],
  }));
  const extraPrice = calculateCustomizationPrice(item, selectionPayload);
  const unitPrice = selectedVariation.price + extraPrice;
  const totalPrice = unitPrice * quantity;
  const missingRequired = groups.find(
    (g) => (g.min_select || 0) > (selections[g.id]?.length || 0),
  );

  const toggleOption = (groupId: string, optionId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setSelections((prev) => {
      const cur = prev[groupId] || [];
      const on = cur.includes(optionId);
      let next = cur;
      if (on) {
        if (cur.length <= (group.min_select || 0)) return prev;
        next = cur.filter((id) => id !== optionId);
      } else if (group.max_select === 1) {
        next = [optionId];
      } else if (cur.length < group.max_select) {
        next = [...cur, optionId];
      }
      return { ...prev, [groupId]: next };
    });
  };

  const decreaseQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const increaseQuantity = () => {
    setQuantity((q) => q + 1);
  };

  const handleAdd = () => {
    if (missingRequired) return;
    onAdd(
      item,
      selectedVariation,
      selectionPayload.filter((s) => s.option_ids.length > 0),
      quantity,
    );
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 sm:items-center sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-[var(--color-washi)] shadow-2xl sm:rounded-2xl"
      >
        <div className="max-h-[92vh] overflow-y-auto pb-24">
          {/* Header Image */}
          <div className="relative h-52 bg-[#e8f5e9] sm:h-64">
            <img
              src={item.image_url || DEFAULT_FOOD_IMAGE}
              alt={translateItemName(item.name, i18n.language)}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-sumi)]/80 text-[var(--color-washi)] text-lg leading-none hover:bg-[var(--color-sumi)] transition-colors cursor-pointer"
              aria-label={t("common.close")}
            >
              ×
            </button>
          </div>

          {/* Item Info */}
          <div className="px-5 pt-5 sm:px-7">
            <h2 className="font-serif text-2xl font-bold text-[var(--color-sumi)]">
              {translateItemName(item.name, i18n.language)}
            </h2>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="text-sm font-semibold text-[var(--color-sumi)]/70">
                €{selectedVariation.price.toFixed(2)}
              </span>
              {item.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--color-shu)]/30 bg-[var(--color-shu)]/5 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-shu)]">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-sumi)]/55">
              {item.description}
            </p>
          </div>

          {/* Variations (size picker) */}
          {variations.length > 1 && (
            <div className="mx-5 mt-5 border-t border-[var(--color-sumi)]/8 pt-5 sm:mx-7">
              <h3 className="text-sm font-bold text-[var(--color-sumi)]">
                {t("order.customization.aLargerDose")}
              </h3>
              <div className="mt-3 space-y-1">
                {variations.map((v) => {
                  const on = selectedVariation.id === v.id;
                  return (
                    <label key={v.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-3 hover:bg-[var(--color-sumi)]/[0.03] transition-colors">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-[var(--color-shu)] bg-[var(--color-shu)]" : "border-[var(--color-sumi)]/25"}`}>
                        {on && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                      <span className="flex-1 text-sm text-[var(--color-sumi)]">{v.label}</span>
                      {v.price > variations[0].price && (
                        <span className="text-sm text-[var(--color-sumi)]/55">+€{(v.price - variations[0].price).toFixed(2)}</span>
                      )}
                      <input type="radio" name="variation" value={v.id} checked={on} onChange={() => setSelectedVariationId(v.id)} className="sr-only" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customization Groups */}
          <div className="mt-2">
            {groups.map((group) => {
              const selectedIds = selections[group.id] || [];
              const isSingle = group.max_select === 1;
              const isReq = (group.min_select || 0) > 0;
              const hasDefaultSelection = isReq && selectedIds.length >= (group.min_select || 0);
              const hideChoiceHelper = isSingle && hasDefaultSelection;
              const translatedTitle = translateCustomizationText(group.title, i18n.language);
              return (
                <div key={group.id} className="mx-5 border-t border-[var(--color-sumi)]/8 pt-5 pb-2 sm:mx-7">
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-sumi)]">{translatedTitle}</h3>
                      {!hideChoiceHelper && (
                        <p className="mt-0.5 text-xs text-[var(--color-sumi)]/45">
                          {t("order.customization.chooseUpTo", { count: group.max_select })}
                        </p>
                      )}
                      {(group.free_select_count || 0) > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-[var(--color-shu)]">
                          {t("order.customization.firstNFree", { count: group.free_select_count })}
                        </p>
                      )}
                      {!isSingle && selectedIds.length >= group.max_select && (
                        <p className="mt-1 text-xs font-semibold text-[var(--color-shu)]">
                          {t("order.customization.maxReached", { count: group.max_select })}
                        </p>
                      )}
                    </div>
                    {isReq && !hasDefaultSelection && (
                      <span className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wide bg-[var(--color-shu)]/10 text-[var(--color-shu)] px-2.5 py-0.5 rounded">
                        {t("order.customization.required")}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-0.5">
                    {group.options.map((opt) => {
                      const on = selectedIds.includes(opt.id);
                      const isMaxed = !isSingle && !on && selectedIds.length >= group.max_select;
                      const idx = selectedIds.indexOf(opt.id);
                      const isFree = on && idx < (group.free_select_count || 0);
                      const translatedLabel = translateCustomizationText(opt.label, i18n.language);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleOption(group.id, opt.id)}
                          disabled={isMaxed}
                          aria-pressed={on}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-3 text-left transition-colors hover:bg-[var(--color-sumi)]/[0.03] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                        >
                          {isSingle ? (
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-[var(--color-shu)] bg-[var(--color-shu)]" : "border-[var(--color-sumi)]/25"}`}>
                              <AnimatePresence initial={false}>
                                {on && (
                                  <motion.span
                                    key="radio-dot"
                                    initial={{ scale: 0.35, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.35, opacity: 0 }}
                                    transition={{ duration: 0.14, ease: "easeOut" }}
                                    className="h-2 w-2 rounded-full bg-white"
                                  />
                                )}
                              </AnimatePresence>
                            </span>
                          ) : (
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${on ? "bg-[var(--color-shu)] border-2 border-[var(--color-shu)]" : "border-2 border-[var(--color-sumi)]/25"}`}>
                              <AnimatePresence initial={false}>
                                {on && (
                                  <motion.svg
                                    key="checkbox-check"
                                    initial={{ scale: 0.65, opacity: 0, rotate: -8 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0.65, opacity: 0, rotate: 8 }}
                                    transition={{ duration: 0.14, ease: "easeOut" }}
                                    className="h-3.5 w-3.5 text-white"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" />
                                  </motion.svg>
                                )}
                              </AnimatePresence>
                            </span>
                          )}
                          <span className="flex-1 text-sm text-[var(--color-sumi)]">{translatedLabel}</span>
                          {opt.price > 0 && (
                            <span className={`text-sm ${isFree ? "text-[var(--color-shu)] font-semibold" : "text-[var(--color-sumi)]/55"}`}>
                              {isFree ? t("order.customization.freeTag") : `+€${opt.price.toFixed(2)}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 border-t border-[var(--color-sumi)]/10 bg-[var(--color-washi)] p-4 sm:px-7">
          <div className="flex items-center gap-0 rounded-full bg-[var(--color-shu)] shrink-0">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-[#a02020] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Decrease quantity"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3.5 8H12.5" /></svg>
            </button>
            <span className="relative block h-5 w-6 overflow-hidden text-center text-sm font-bold text-white tabular-nums">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={quantity}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
            </span>
            <button type="button" onClick={increaseQuantity} className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-[#a02020] transition-colors cursor-pointer" aria-label="Increase quantity">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3.5V12.5M3.5 8H12.5" /></svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={Boolean(missingRequired)}
            className="flex-1 rounded-full bg-[var(--color-shu)] py-3 text-center text-sm font-bold text-white transition-all hover:bg-[#a02020] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {missingRequired
              ? t("order.customization.pleaseChoose", { title: translateCustomizationText(missingRequired.title, i18n.language).toLowerCase() })
              : `${t("order.addToOrder")}  €${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── OrderOnline Page ───────────────────────────────────────────────
export function OrderOnline() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAddedFromUrl = useRef(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [selectedVariationIds, setSelectedVariationIds] = useState<
    Record<string, string>
  >({});
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const ITEMS_PER_PAGE = 10;
  const loaderRef = useRef<HTMLDivElement>(null);

  const { cart, addToCart, totalItems, totalPrice } = useCart();
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (
    item: MenuItem,
    selectedVariation: MenuItemVariation,
    customizationSelections: MenuCustomizationSelection[] = [],
    qty: number = 1,
  ) => {
    for (let i = 0; i < qty; i++) {
      addToCart(item, selectedVariation, customizationSelections);
    }
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };
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
        setMenuItems(items);
        if (items.length === 0) setMenuLoadError(t("order.menuUnavailableDesc"));
      } catch (err: any) {
        console.warn("Failed to load menu from Firestore:", err.message);
        setMenuItems([]);
        setMenuLoadError(t("order.menuUnavailableDesc"));
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenu();
  }, [t]);
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
    setIsLoadingMore(false);
  }, [activeCategory]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoadingMenu || isLoadingMore || displayLimit >= filteredMenu.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
        }
      },
      { rootMargin: "0px 0px 160px 0px", threshold: 0 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [isLoadingMenu, isLoadingMore, filteredMenu.length, displayLimit]);

  useEffect(() => {
    if (!isLoadingMore) return;

    const timeout = window.setTimeout(() => {
      setDisplayLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredMenu.length));
      setIsLoadingMore(false);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [isLoadingMore, filteredMenu.length]);

  // Handle adding item from URL query parameter
  useEffect(() => {
    if (isLoadingMenu || menuItems.length === 0 || hasAddedFromUrl.current)
      return;

    const params = new URLSearchParams(location.search);
    const itemId = params.get("addItem");

    if (itemId) {
      const itemToAdd = menuItems.find((item) => item.id === itemId);
      if (itemToAdd) {
        if (hasMenuCustomizations(itemToAdd)) {
          setCustomizingItem(itemToAdd);
        } else {
          addToCart(itemToAdd, getDefaultMenuItemVariation(itemToAdd));
        }
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
  }, [
    isLoadingMenu,
    menuItems,
    location.search,
    navigate,
    addToCart,
    location.pathname,
  ]);

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
      <AnimatePresence>
        {customizingItem && (
          <CustomizationModal
            item={customizingItem}
            onClose={() => setCustomizingItem(null)}
            onAdd={handleAddToCart}
          />
        )}
      </AnimatePresence>
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
        <span className="text-[20rem] md:text-[40rem] font-serif leading-none">
          味
        </span>
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
            className="mb-4 md:mb-8 border-b border-[var(--color-sumi)]/10 pb-8 relative"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 items-start">
              {Array.from({ length: MENU_SKELETON_COUNT }).map((_, index) => (
                <MenuItemSkeleton key={index} />
              ))}
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
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 items-start"
            >
              <AnimatePresence mode="popLayout">
                {paginatedMenu.map((item, idx) => {
                  const variations = getMenuItemVariations(item);
                  const selectedVariation =
                    variations.find(
                      (variation) =>
                        variation.id === selectedVariationIds[item.id],
                    ) || variations[0];
                  return (
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

                      <div className="w-full sm:w-36 h-48 sm:h-36 overflow-hidden shrink-0 relative shadow-sm bg-[var(--color-sumi)]/5">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={translateItemName(item.name)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
                            }}
                          />
                        ) : (
                          <img
                            src={DEFAULT_FOOD_IMAGE}
                            alt={translateItemName(item.name)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
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
                              {translateItemName(item.name)}
                            </h3>
                            <span className="font-medium text-[var(--color-sumi)]/80 whitespace-nowrap border-b border-[var(--color-sumi)]/10 pb-1">
                              {getMenuItemPriceRange(item)}
                            </span>
                          </div>
                          <MenuDescription text={item.description} />
                        </div>
                        {variations.length > 1 && (
                          <div className="mb-4 grid grid-cols-2 gap-2">
                            {variations.map((variation) => (
                              <button
                                key={variation.id}
                                type="button"
                                onClick={() =>
                                  setSelectedVariationIds((prev) => ({
                                    ...prev,
                                    [item.id]: variation.id,
                                  }))
                                }
                                className={`border px-3 py-2 text-left transition-colors cursor-pointer ${
                                  selectedVariation.id === variation.id
                                    ? "border-[var(--color-shu)] bg-[var(--color-shu)]/10 text-[var(--color-shu)]"
                                    : "border-[var(--color-sumi)]/10 text-[var(--color-sumi)]/60 hover:border-[var(--color-sumi)]/30"
                                }`}
                              >
                                <span className="block text-[10px] uppercase tracking-[0.15em] font-bold truncate">
                                  {variation.label}
                                </span>
                                <span className="block text-xs mt-0.5">
                                  €{variation.price.toFixed(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => hasMenuCustomizations(item) ? setCustomizingItem(item) : handleAddToCart(item, selectedVariation)}
                          className="self-start mt-auto text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)] hover:text-[var(--color-shu)] transition-colors flex items-center gap-2 group/btn cursor-pointer min-h-6"
                        >
                          <AnimatePresence mode="wait">
                            {addedItemIds[item.id] || cart.some((c) => c.item.id === item.id) ? (
                              <motion.span
                                key="added"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="text-[var(--color-shu)] font-bold flex items-center gap-1.5"
                              >
                                ✓ {t("order.added")}
                              </motion.span>
                            ) : (
                              <motion.span
                                key="add"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2"
                              >
                                <span className="w-6 h-[1px] bg-current transition-all duration-300 group-hover/btn:w-10"></span>{" "}
                                {t("order.addToOrder")}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Infinite Scroll Trigger & Spinner */}
          {!isLoadingMenu && hasMore && (
            <div ref={loaderRef} className="mt-16 flex min-h-24 justify-center py-8">
              <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
