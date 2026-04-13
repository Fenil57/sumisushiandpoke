import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Minus,
  AlertCircle,
  Check,
  User,
  Phone,
  Mail,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getMenuItems, type MenuItem } from "../services/menuService";
import { useSettings } from "../hooks/useSettings";
import { getApiUrl, readApiJson } from "../lib/api";

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

type CheckoutStep = "cart" | "customer-info";
const DELIVERY_FEE_THRESHOLD = 20;
const DEFAULT_DELIVERY_FEE = 3;
const FREE_DELIVERY_RADIUS_METERS = 5000;
const CHECKOUT_STORAGE_KEY = "sumi-flatpay-checkout";

// Regex for Finnish address validation
// Updated: Made comma optional to support "Street 3 12345 City" format
const FINNISH_ADDRESS_REGEX =
  /^[a-zA-ZäöåÄÖÅ\s\-'.]+?\s+\d+[a-zA-Z]?(?:\s*[,\-]\s*(?:A|B|C|D|E|F|G|H|J|K|L|M|N|O|P|R|S|T|U|V|W|X|Y|Z|Ä|Ö)\d*)?[,\s\\n]+\s*\d{4,5}\s+[a-zA-ZäöåÄÖÅ\s\-'.]+(?:[,\\n]+\s*Finland)?$/i;

/**
 * Validates if an address matches Finnish address format
 */
function isValidFinnishAddress(address: string): boolean {
  if (address.length < 10) {
    return false;
  }

  // Must contain a postal code (4-5 digits)
  if (!/\b\d{4,5}\b/.test(address)) {
    return false;
  }

  // Must contain at least one letter (street name)
  if (!/[a-zA-ZäöåÄÖÅ]/.test(address)) {
    return false;
  }

  // Must contain at least one number (street number)
  if (!/\d/.test(address)) {
    return false;
  }

  // Check against the regex pattern
  return FINNISH_ADDRESS_REGEX.test(address.trim());
}

interface DeliveryQuote {
  address: string;
  matchedCustomerAddress: string;
  distanceMeters: number;
  withinFreeDeliveryRadius: boolean;
  isFallback?: boolean;
}

interface StoredCheckoutState {
  cart: { item: MenuItem; quantity: number }[];
  checkoutStep: CheckoutStep;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  orderType: "delivery" | "pickup";
  deliveryQuote: DeliveryQuote | null;
}

interface DeliveryValidationResponse {
  distanceMeters: number;
  withinFreeDeliveryRadius: boolean;
  matchedCustomerAddress?: string;
  isFallback?: boolean;
}

interface FlatpayVerifyResponse {
  outcome:
    | "paid"
    | "pending"
    | "cancelled"
    | "failed"
    | "missing_checkout"
    | "missing_payment";
  orderId?: string;
}

interface FlatpaySessionResponse {
  checkoutUrl?: string;
}

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
  const { settings } = useSettings();
  const hasAddedFromUrl = useRef(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(
    null,
  );
  const [deliveryAddressError, setDeliveryAddressError] = useState<
    string | null
  >(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);

  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isVerifyingPaymentReturn, setIsVerifyingPaymentReturn] =
    useState(false);
  const [hasRestoredCheckout, setHasRestoredCheckout] = useState(false);

  const deliveryFeeSetting =
    typeof settings.deliveryFee === "number"
      ? settings.deliveryFee
      : DEFAULT_DELIVERY_FEE;
  const normalizedDeliveryAddress = deliveryAddress.trim();
  const hasValidatedDeliveryQuote =
    orderType === "delivery" &&
    !!deliveryQuote &&
    deliveryQuote.address === normalizedDeliveryAddress;

  // Load menu from Firestore
  useEffect(() => {
    async function loadMenu() {
      try {
        setIsLoadingMenu(true);
        const items = await getMenuItems();
        if (items.length > 0) {
          setMenuItems(items);
        } else {
          // No items in Firestore — use fallback
          console.warn("No menu items in Firestore, using fallback menu");
          setMenuItems(FALLBACK_MENU);
        }
      } catch (err: any) {
        console.warn(
          "Failed to load menu from Firestore, using fallback:",
          err.message,
        );
        setMenuItems(FALLBACK_MENU);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenu();
  }, []);

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
  }, [isLoadingMenu, menuItems, location.search, navigate, location.pathname]);

  useEffect(() => {
    try {
      const rawValue = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!rawValue) {
        setHasRestoredCheckout(true);
        return;
      }

      const savedState = JSON.parse(rawValue) as StoredCheckoutState;
      setCart(Array.isArray(savedState.cart) ? savedState.cart : []);
      setCheckoutStep(savedState.checkoutStep || "cart");
      setCustomerName(savedState.customerName || "");
      setCustomerPhone(savedState.customerPhone || "");
      setCustomerEmail(savedState.customerEmail || "");
      setDeliveryAddress(savedState.deliveryAddress || "");
      setOrderType(savedState.orderType || "delivery");
      setDeliveryQuote(savedState.deliveryQuote || null);
    } catch (error) {
      console.warn("Failed to restore checkout draft:", error);
      clearStoredCheckout();
    } finally {
      setHasRestoredCheckout(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredCheckout || orderComplete) {
      return;
    }

    if (
      cart.length === 0 &&
      !customerName &&
      !customerPhone &&
      !customerEmail &&
      !deliveryAddress
    ) {
      clearStoredCheckout();
      return;
    }

    const snapshot: StoredCheckoutState = {
      cart,
      checkoutStep,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      orderType,
      deliveryQuote,
    };

    window.sessionStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  }, [
    cart,
    checkoutStep,
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    orderType,
    deliveryQuote,
    hasRestoredCheckout,
    orderComplete,
  ]);

  const categories: string[] = [
    "All",
    ...new Set<string>(menuItems.map((item) => item.category)),
  ];
  const filteredMenu =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);
  const total = cart.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0,
  );
  const isWithinFreeDeliveryRadius =
    hasValidatedDeliveryQuote && deliveryQuote.withinFreeDeliveryRadius;
  // Free delivery: within 5km radius AND order > €20
  // Charged delivery: outside 5km radius OR order ≤ €20
  const isDeliveryFeeApplied =
    orderType === "delivery" &&
    (!isWithinFreeDeliveryRadius || total <= DELIVERY_FEE_THRESHOLD);
  const deliveryFee = isDeliveryFeeApplied ? deliveryFeeSetting : 0;
  const grandTotal = total + deliveryFee;

  const clearStoredCheckout = () => {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  };

  const resetCheckoutState = () => {
    setCart([]);
    setCheckoutStep("cart");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDeliveryAddress("");
    setOrderType("delivery");
    setDeliveryQuote(null);
    setDeliveryAddressError(null);
    setPaymentError(null);
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const removeOneFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      return prev.filter((i) => i.item.id !== itemId);
    });
  };

  const handleProceedToCustomerInfo = () => {
    setCheckoutStep("customer-info");
  };

  useEffect(() => {
    setDeliveryAddressError(null);
  }, [orderType, normalizedDeliveryAddress]);

  useEffect(() => {
    if (orderType === "pickup") {
      setDeliveryQuote(null);
      setDeliveryAddressError(null);
      return;
    }

    if (deliveryQuote && deliveryQuote.address !== normalizedDeliveryAddress) {
      setDeliveryQuote(null);
    }
  }, [orderType, normalizedDeliveryAddress, deliveryQuote]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceHandle = params.get("invoice")?.trim();
    const paymentState = params.get("flatpay")?.trim();
    const returnError = params.get("error")?.trim();

    if (!invoiceHandle && !paymentState && !returnError) {
      return;
    }

    let isActive = true;

    async function verifyReturn() {
      setIsVerifyingPaymentReturn(true);
      setPaymentError(null);

      const clearReturnParams = () => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      };

      try {
        if (invoiceHandle) {
          const response = await fetch(
            getApiUrl(
              `/api/flatpay/verify?invoice=${encodeURIComponent(invoiceHandle)}`,
            ),
          );
          const data = await readApiJson<FlatpayVerifyResponse>(
            response,
            t("checkout.paymentVerificationFailed"),
          );

          if (!isActive) {
            return;
          }

          if (data.outcome === "paid" && data.orderId) {
            setOrderId(data.orderId);
            setOrderComplete(true);
            resetCheckoutState();
            clearStoredCheckout();
            clearReturnParams();
            return;
          }

          if (data.outcome === "cancelled") {
            setCheckoutStep("customer-info");
            setPaymentError(t("checkout.paymentCancelled"));
            clearReturnParams();
            return;
          }

          if (data.outcome === "failed") {
            setCheckoutStep("customer-info");
            setPaymentError(t("checkout.paymentFailed"));
            clearReturnParams();
            return;
          }

          if (data.outcome === "pending") {
            setCheckoutStep("customer-info");
            setPaymentError(t("checkout.paymentPending"));
            clearReturnParams();
            return;
          }
        }

        if (paymentState === "cancelled" || returnError) {
          setCheckoutStep("customer-info");
          setPaymentError(t("checkout.paymentCancelled"));
        }
      } catch (err: any) {
        if (isActive) {
          setCheckoutStep("customer-info");
          setPaymentError(
            err.message || t("checkout.paymentVerificationFailed"),
          );
        }
      } finally {
        if (isActive) {
          setIsVerifyingPaymentReturn(false);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    }

    verifyReturn();

    return () => {
      isActive = false;
    };
  }, [t]);

  const validateDeliveryAddress = async (): Promise<DeliveryQuote | null> => {
    if (orderType !== "delivery") {
      return null;
    }

    if (!normalizedDeliveryAddress) {
      setDeliveryAddressError(t("checkout.deliveryAddressRequired"));
      return null;
    }

    // Validate address format before making API call
    if (!isValidFinnishAddress(normalizedDeliveryAddress)) {
      setDeliveryAddressError(
        "Invalid address format. Please provide a valid Finnish address (e.g., Streetname 123, 12345 City, Finland).",
      );
      return null;
    }

    if (hasValidatedDeliveryQuote && deliveryQuote) {
      return deliveryQuote;
    }

    setIsCheckingDelivery(true);
    setDeliveryAddressError(null);

    try {
      const response = await fetch(
        getApiUrl("/api/validate-delivery-address"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerAddress: normalizedDeliveryAddress,
            restaurantAddress: settings.address,
          }),
        },
      );
      const data = await readApiJson<DeliveryValidationResponse>(
        response,
        "We could not validate that delivery address.",
      );

      const quote: DeliveryQuote = {
        address: normalizedDeliveryAddress,
        matchedCustomerAddress:
          data.matchedCustomerAddress || normalizedDeliveryAddress,
        distanceMeters: data.distanceMeters,
        withinFreeDeliveryRadius: Boolean(data.withinFreeDeliveryRadius),
        isFallback: data.isFallback,
      };

      setDeliveryQuote(quote);
      return quote;
    } catch (err: any) {
      const message =
        err.message || t("checkout.deliveryAddressValidationError");
      setDeliveryAddressError(message);
      return null;
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;

    const validatedQuote = await validateDeliveryAddress();
    if (orderType === "delivery" && !validatedQuote) {
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch(getApiUrl("/api/flatpay/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: orderType,
          customer_info: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address:
              orderType === "delivery" ? normalizedDeliveryAddress : undefined,
          },
          order_items: cart.map(({ item, quantity }) => ({
            menu_item_id: item.id,
            quantity,
          })),
        }),
      });
      const data = await readApiJson<FlatpaySessionResponse>(
        response,
        t("checkout.paymentInitializationFailed"),
      );

      if (!data.checkoutUrl) {
        throw new Error(t("checkout.paymentInitializationFailed"));
      }

      window.location.assign(data.checkoutUrl);
    } catch (err: any) {
      setPaymentError(err.message || t("checkout.paymentInitializationFailed"));
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCancelCheckout = () => {
    setCheckoutStep("cart");
    setPaymentError(null);
  };

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
      {/* Decorative background elements */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-sumi) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      {/* Large background Kanji */}
      <div className="fixed -left-10 md:-left-20 top-1/4 opacity-[0.03] md:opacity-[0.04] pointer-events-none z-0 select-none">
        <span className="text-[20rem] md:text-[40rem] font-serif leading-none">
          味
        </span>
      </div>

      {/* Vertical Japanese text */}
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

      {/* Wave pattern overlay at the bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 h-64 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%232c2825' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
        }}
      ></div>

      {/* Floating Mobile Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 lg:hidden"
          >
            <button
              onClick={() =>
                document
                  .getElementById("cart-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full bg-[var(--color-shu)] text-[var(--color-washi)] py-4 px-6 shadow-2xl flex items-center justify-between group active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <RamenBowlIcon className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-[var(--color-washi)] text-[var(--color-shu)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <span className="text-xs tracking-[0.2em] uppercase font-bold">
                  {t("order.yourOrder")}
                </span>
              </div>
              <span className="font-serif font-bold text-lg">
                €{grandTotal.toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 relative z-10"
      >
        {/* Success Modal */}
        <AnimatePresence>
          {orderComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-sumi)]/80 backdrop-blur-sm px-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[var(--color-washi)] p-12 max-w-md w-full text-center relative border border-[var(--color-shu)]/40 shadow-2xl"
              >
                <div className="w-16 h-16 bg-[var(--color-shu)] text-[var(--color-washi)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-serif font-bold text-[var(--color-sumi)] mb-4">
                  {t("order.confirmed")}
                </h2>
                <p className="text-[var(--color-sumi)]/70 mb-2 text-sm leading-relaxed">
                  {t("order.confirmedDesc")}
                </p>
                {orderId && (
                  <p className="text-[var(--color-sumi)]/40 mb-8 text-xs tracking-wide">
                    {t("order.orderNumber")}: #{orderId.slice(-8).toUpperCase()}
                  </p>
                )}
                <button
                  onClick={() => {
                    setOrderComplete(false);
                    setOrderId(null);
                  }}
                  className="px-8 py-4 bg-[var(--color-sumi)] text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[var(--color-shu)] transition-colors w-full cursor-pointer"
                >
                  {t("order.backToMenu")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex gap-8 mb-12 overflow-x-auto pb-4 border-b border-[var(--color-sumi)]/10"
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-12">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-6 p-4 -mx-4 animate-pulse"
                >
                  <div className="w-full sm:w-36 h-48 sm:h-36 bg-[var(--color-sumi)]/5 shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-6 bg-[var(--color-sumi)]/5 w-3/4" />
                    <div className="h-4 bg-[var(--color-sumi)]/5 w-full" />
                    <div className="h-4 bg-[var(--color-sumi)]/5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-12"
            >
              <AnimatePresence mode="popLayout">
                {filteredMenu.map((item, idx) => (
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
        </div>

        {/* Cart / Checkout Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full lg:w-80 xl:w-96 shrink-0 z-20"
          id="cart-section"
        >
          <div className="sticky top-32 bg-[var(--color-sumi)] text-[var(--color-washi)] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Decorative background element */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(var(--color-washi) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            {/* Hanko stamp decorative element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 border border-[var(--color-shu)]/20 rounded-full flex items-center justify-center opacity-50 transform rotate-12 pointer-events-none">
              <div className="w-28 h-28 border border-[var(--color-shu)]/20 rounded-full flex items-center justify-center">
                <span className="text-[var(--color-shu)]/20 font-serif text-4xl">
                  旨味
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[var(--color-washi)] pb-4 border-b border-[var(--color-washi)]/10 flex items-center gap-3 relative z-10">
              <RamenBowlIcon
                className="w-7 h-7 text-[var(--color-shu)]"
                strokeWidth={2}
              />
              {checkoutStep === "cart"
                ? t("order.yourOrder")
                : t("checkout.yourDetails")}
            </h2>

            {isVerifyingPaymentReturn && (
              <div className="relative z-10 mt-4 flex items-center gap-3 bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 px-4 py-3 text-xs text-[var(--color-washi)]/70">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-[var(--color-shu)]/40 border-t-transparent rounded-full shrink-0"
                />
                <span>{t("checkout.paymentVerifying")}</span>
              </div>
            )}

            {/* === CART VIEW === */}
            {checkoutStep === "cart" && (
              <>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-[var(--color-washi)]/40 relative z-10"
                  >
                    <RamenBowlIcon
                      className="w-16 h-16 mb-4 opacity-30"
                      strokeWidth={1}
                    />
                    <p className="text-sm italic">{t("order.emptyCart")}</p>
                    <p className="text-xs mt-2">{t("order.addItems")}</p>
                  </motion.div>
                ) : (
                  <div className="relative z-10">
                    <div className="max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                      <AnimatePresence mode="popLayout">
                        {cart.map(({ item, quantity }) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            key={item.id}
                            className="flex flex-col gap-3 py-4 border-b border-[var(--color-washi)]/10 last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[var(--color-washi)]">
                                {item.name}
                              </span>
                              <span className="text-[var(--color-washi)]/80 font-medium">
                                €{(item.price * quantity).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => removeOneFromCart(item.id)}
                                  className="w-7 h-7 rounded-full border border-[var(--color-washi)]/30 flex items-center justify-center text-[var(--color-washi)]/80 hover:bg-[var(--color-shu)] hover:border-[var(--color-shu)] hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                                >
                                  <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span className="font-medium text-[var(--color-washi)] text-sm w-4 text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-full border border-[var(--color-washi)]/30 flex items-center justify-center text-[var(--color-washi)]/80 hover:bg-[var(--color-shu)] hover:border-[var(--color-shu)] hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-[var(--color-washi)]/40 hover:text-[var(--color-shu)] text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                              >
                                {t("order.remove")}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <motion.div
                      layout
                      className="border-t border-[var(--color-sumi)]/10 pt-4 space-y-4 mb-6"
                    >
                      {/* Order type toggle */}
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setOrderType("delivery")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase font-bold border transition-all cursor-pointer ${
                            orderType === "delivery"
                              ? "border-[var(--color-shu)] bg-[var(--color-shu)]/10 text-[var(--color-shu)]"
                              : " text-[var(--color-washi)]/40"
                          }`}
                        >
                          <Truck size={14} /> {t("order.delivery")}
                        </button>
                        <button
                          onClick={() => setOrderType("pickup")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase font-bold border transition-all cursor-pointer ${
                            orderType === "pickup"
                              ? "border-[var(--color-shu)] bg-[var(--color-shu)]/10 text-[var(--color-shu)]"
                              : "text-[var(--color-washi)]/40"
                          }`}
                        >
                          <ShoppingBag size={14} /> {t("order.pickup")}
                        </button>
                      </div>

                      <div className="flex justify-between text-sm text-[var(--color-washi)]/70">
                        <span>{t("order.subtotal")}</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-[var(--color-washi)]/70">
                        <span>{t("order.deliveryFee")}</span>
                        <span>
                          {orderType === "pickup" || !isDeliveryFeeApplied
                            ? t("order.free")
                            : `€${deliveryFeeSetting.toFixed(2)}`}
                        </span>
                      </div>
                      {orderType === "delivery" && (
                        <div className="text-[10px] text-[var(--color-washi)]/50 -mt-2 leading-relaxed">
                          <span className="text-[var(--color-shu)] font-medium">
                            Free delivery
                          </span>{" "}
                          within 5 km for orders over €
                          {DELIVERY_FEE_THRESHOLD.toFixed(2)}. Orders below €
                          {DELIVERY_FEE_THRESHOLD.toFixed(2)} or outside 5 km
                          incur a €{deliveryFeeSetting.toFixed(2)} charge.
                        </div>
                      )}

                      {deliveryQuote?.isFallback && (
                        <div className="flex items-start gap-2 p-3 bg-[var(--color-shu)]/10 border border-[var(--color-shu)]/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-[var(--color-shu)] shrink-0 mt-0.5" />
                          <p className="text-[10px] text-[var(--color-washi)]/70 italic leading-relaxed">
                            Unable to precisely verify distance. Standard
                            delivery fee of €{deliveryFeeSetting.toFixed(2)} has
                            been applied to ensure your order can proceed.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between font-serif font-bold text-2xl text-[var(--color-washi)] pt-4 border-t border-[var(--color-washi)]/10">
                        <span>{t("order.total")}</span>
                        <span>€{grandTotal.toFixed(2)}</span>
                      </div>
                    </motion.div>

                    <motion.button
                      layout
                      onClick={handleProceedToCustomerInfo}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden w-full py-4 bg-[var(--color-shu)] text-[var(--color-washi)] font-serif text-xl tracking-wide hover:bg-[#a02020] transition-colors cursor-pointer"
                    >
                      {t("order.proceed")}
                    </motion.button>
                  </div>
                )}
              </>
            )}

            {/* === CUSTOMER INFO STEP === */}
            {checkoutStep === "customer-info" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 pt-4"
              >
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">
                      {t("checkout.name")} *
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30"
                      />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        placeholder={t("checkout.namePlaceholder")}
                        className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/20 text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">
                      {t("checkout.phone")} *
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        placeholder="+358 44 123 4567"
                        className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/20 text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">
                      {t("checkout.email")}
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30"
                      />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder={t("checkout.emailPlaceholder")}
                        className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/20 text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors"
                      />
                    </div>
                  </div>
                  {orderType === "delivery" && (
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50">
                          {t("checkout.deliveryAddress")} *
                        </label>
                        <button
                          type="button"
                          onClick={validateDeliveryAddress}
                          disabled={
                            isCheckingDelivery || !normalizedDeliveryAddress
                          }
                          className="text-[10px] tracking-[0.15em] uppercase font-bold text-[var(--color-shu)] hover:text-[#a02020] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer mb-0.5"
                        >
                          {isCheckingDelivery
                            ? t("checkout.checkingAddress")
                            : hasValidatedDeliveryQuote
                              ? t("checkout.checkAddress") // Allow re-checking if they change it
                              : t("checkout.checkAddress")}
                        </button>
                      </div>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required={orderType === "delivery"}
                        placeholder={t("checkout.deliveryAddressPlaceholder")}
                        className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/20 text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors resize-none h-24"
                      />

                      {/* Simplified status feedback */}
                      {deliveryAddressError && (
                        <div className="flex items-center gap-2 text-[10px] text-red-400">
                          <AlertCircle size={12} />
                          <span>{deliveryAddressError}</span>
                        </div>
                      )}

                      {hasValidatedDeliveryQuote &&
                        deliveryQuote &&
                        !deliveryAddressError && (
                          <div className="flex items-center gap-2">
                            <Check
                              size={14}
                              className="shrink-0 text-[var(--color-washi)]"
                            />
                            <span className="text-[10px] tracking-wide font-medium text-[var(--color-washi)]/80">
                              {!isDeliveryFeeApplied
                                ? "Free delivery"
                                : "Standard delivery pricing applies"}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Order summary mini */}
                <div className="border-t border-[var(--color-washi)]/20 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-[var(--color-washi)]/50">
                    <span>{t("order.subtotal")}</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-washi)]/50">
                    <span>{t("order.deliveryFee")}</span>
                    <span>
                      {orderType === "pickup" ||
                      isWithinFreeDeliveryRadius ||
                      !isDeliveryFeeApplied
                        ? t("order.free")
                        : `€${deliveryFeeSetting.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-serif font-bold text-xl text-[var(--color-washi)] pt-2 border-t border-[var(--color-washi)]/10">
                    <span>{t("order.total")}</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {paymentError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-3 mb-4"
                  >
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-xs">{paymentError}</span>
                  </motion.div>
                )}

                <p className="text-[10px] text-[var(--color-washi)]/40 mb-4">
                  {t("checkout.flatpayRedirectHint")}
                </p>

                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={handleProceedToPayment}
                    disabled={
                      !customerName.trim() ||
                      !customerPhone.trim() ||
                      (orderType === "delivery" &&
                        !normalizedDeliveryAddress) ||
                      isCreatingPayment
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden w-full py-4 bg-[var(--color-shu)] text-[var(--color-washi)] font-serif text-xl tracking-wide hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span
                      className={`transition-opacity duration-300 ${isCreatingPayment ? "opacity-0" : "opacity-100"}`}
                    >
                      {t("checkout.proceedToPayment")}
                    </span>
                    {isCreatingPayment && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-[var(--color-shu)]/40 border-t-transparent rounded-full"
                        />
                      </span>
                    )}
                  </motion.button>

                  <button
                    onClick={handleCancelCheckout}
                    className="w-full py-3 text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] transition-colors cursor-pointer"
                  >
                    {t("checkout.backToCart")}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
