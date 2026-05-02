import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import { getApiUrl, readApiJson } from "../lib/api";
import { useCart } from "../context/CartContext";

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
const isOnlinePaymentEnabled =
  import.meta.env.VITE_ENABLE_ONLINE_PAYMENT === "true";

/**
 * Flexible Finnish address validator.
 *
 * Accepts common formats locals actually type:
 *   "Yo-kylä 23A 22, Turku"
 *   "Hämeenkatu 12 B 45, 33100 Tampere"
 *   "Kauppakatu 5, Kaarina, Finland"
 *   "Eerikinkatu 3a-7, 20100 Turku, Finland"
 *   "Ratapihankatu 9, Helsinki"
 *
 * Rules (intentionally lenient):
 *  1. Must be at least 8 chars
 *  2. Must contain letters (street / city name)
 *  3. Must contain at least one digit (street number)
 *  4. Must have a street-name-like part followed by a number
 *  5. Must contain a word that looks like a city name after a comma / newline / postal code
 */
function isValidFinnishAddress(address: string): boolean {
  const trimmed = address.trim();

  // Basic length guard
  if (trimmed.length < 8) return false;

  // Must contain at least one letter and one digit
  if (!/[a-zA-ZäöåÄÖÅ]/.test(trimmed)) return false;
  if (!/\d/.test(trimmed)) return false;

  // Street part: one or more words (letters, hyphens, dots, apostrophes)
  // followed by a street number (digit, optionally with a letter suffix)
  // The number may be followed by apartment/staircase info like "A 22", "B14", "a-7"
  const streetPattern =
    /[a-zA-ZäöåÄÖÅ][a-zA-ZäöåÄÖÅ\s\-'.]{1,}\s+\d+/i;
  if (!streetPattern.test(trimmed)) return false;

  // After the street+number block there should be *something* that looks
  // like a city — a word of 2+ letters separated by comma, newline, or
  // a Finnish postal code (optionally).  We split on common delimiters
  // and look for a "city-like" token.
  const parts = trimmed.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return false; // at minimum: street part , city part

  // The last 1-2 parts should contain the city (and optionally "Finland"
  // or a postal code like 20540).  We just need at least one token that
  // is purely letters (the city name).
  const cityCandidate = parts
    .slice(1) // everything after the street chunk
    .join(" ")
    .replace(/\b\d{4,5}\b/g, "")  // strip postal code if present
    .replace(/\b(finland|suomi|fi)\b/gi, "") // strip country
    .trim();

  // After stripping postal code & country, there should still be a word
  // with 2+ letters (the city name).
  if (!/[a-zA-ZäöåÄÖÅ]{2,}/.test(cityCandidate)) return false;

  return true;
}

interface DeliveryQuote {
  address: string;
  matchedCustomerAddress: string;
  distanceMeters: number;
  withinFreeDeliveryRadius: boolean;
  isFallback?: boolean;
}

interface StoredCheckoutState {
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

interface ManualOrderResponse {
  orderId?: string;
}

export function Cart() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, hasLiveSettings } = useSettings();
  const { cart, addToCart, removeFromCart, removeOneFromCart, clearCart, totalItems, totalPrice } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryAddressError, setDeliveryAddressError] = useState<string | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);

  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isVerifyingPaymentReturn, setIsVerifyingPaymentReturn] = useState(false);
  const [hasRestoredCheckout, setHasRestoredCheckout] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const deliveryFeeSetting = typeof settings.deliveryFee === "number" ? settings.deliveryFee : DEFAULT_DELIVERY_FEE;
  const normalizedDeliveryAddress = deliveryAddress.trim();
  const hasValidatedDeliveryQuote = orderType === "delivery" && !!deliveryQuote && deliveryQuote.address === normalizedDeliveryAddress;

  useEffect(() => {
    try {
      const rawValue = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!rawValue) {
        setHasRestoredCheckout(true);
        return;
      }
      const savedState = JSON.parse(rawValue) as StoredCheckoutState;
      setCheckoutStep(savedState.checkoutStep || "cart");
      setCustomerName(savedState.customerName || "");
      setCustomerPhone(savedState.customerPhone || "");
      setCustomerEmail(savedState.customerEmail || "");
      setDeliveryAddress(savedState.deliveryAddress || "");
      setOrderType(savedState.orderType || "delivery");
      setDeliveryQuote(savedState.deliveryQuote || null);
    } catch (error) {
      console.warn("Failed to restore checkout draft, but continuing:", error);
      clearStoredCheckout();
    } finally {
      setHasRestoredCheckout(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredCheckout || orderComplete) return;

    if (cart.length === 0 && !customerName && !customerPhone && !customerEmail && !deliveryAddress) {
      clearStoredCheckout();
      return;
    }

    const snapshot: StoredCheckoutState = {
      checkoutStep,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      orderType,
      deliveryQuote,
    };
    window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(snapshot));
  }, [cart, checkoutStep, customerName, customerPhone, customerEmail, deliveryAddress, orderType, deliveryQuote, hasRestoredCheckout, orderComplete]);

  const isWithinFreeDeliveryRadius = hasValidatedDeliveryQuote && deliveryQuote?.withinFreeDeliveryRadius;
  const isDeliveryFeeApplied = cart.length > 0 && orderType === "delivery" && (!isWithinFreeDeliveryRadius || totalPrice <= DELIVERY_FEE_THRESHOLD);
  const deliveryFee = isDeliveryFeeApplied ? deliveryFeeSetting : 0;
  const grandTotal = cart.length > 0 ? totalPrice + deliveryFee : 0;

  const clearStoredCheckout = () => {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  };

  const resetCheckoutState = () => {
    clearCart();
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

  const handleProceedToCustomerInfo = () => setCheckoutStep("customer-info");

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
    if (!isOnlinePaymentEnabled) return;

    const params = new URLSearchParams(window.location.search);
    const invoiceHandle = params.get("invoice")?.trim();
    const paymentState = params.get("flatpay")?.trim();
    const returnError = params.get("error")?.trim();

    if (!invoiceHandle && !paymentState && !returnError) return;

    let isActive = true;

    async function verifyReturn() {
      setIsVerifyingPaymentReturn(true);
      setPaymentError(null);

      const clearReturnParams = () => {
        window.history.replaceState({}, document.title, window.location.pathname);
      };

      try {
        if (invoiceHandle) {
          const response = await fetch(getApiUrl(`/api/flatpay/verify?invoice=${encodeURIComponent(invoiceHandle)}`));
          const data = await readApiJson<FlatpayVerifyResponse>(response, t("checkout.paymentVerificationFailed"));

          if (!isActive) return;

          if (data.outcome === "paid" && data.orderId) {
            setOrderId(data.orderId);
            setOrderComplete(true);
            resetCheckoutState();
            clearStoredCheckout();
            clearReturnParams();
            return;
          }

          if (data.outcome === "cancelled" || data.outcome === "failed" || data.outcome === "pending") {
            setCheckoutStep("customer-info");
            setPaymentError(data.outcome === "cancelled" ? t("checkout.paymentCancelled") : data.outcome === "failed" ? t("checkout.paymentFailed") : t("checkout.paymentPending"));
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
          setPaymentError(err.message || t("checkout.paymentVerificationFailed"));
        }
      } finally {
        if (isActive) {
          setIsVerifyingPaymentReturn(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    verifyReturn();
    return () => { isActive = false; };
  }, [t]);

  const validateDeliveryAddress = async (): Promise<DeliveryQuote | null> => {
    if (orderType !== "delivery") return null;
    if (!normalizedDeliveryAddress) {
      setDeliveryAddressError(t("checkout.deliveryAddressRequired"));
      return null;
    }
    if (!isValidFinnishAddress(normalizedDeliveryAddress)) {
      setDeliveryAddressError("Please enter a valid address with street name, number, and city (e.g., Kauppakatu 5, Turku).");
      return null;
    }
    if (!hasLiveSettings || !settings.address.trim()) {
      setDeliveryAddressError(t("checkout.deliveryUnavailable"));
      return null;
    }
    if (hasValidatedDeliveryQuote && deliveryQuote) return deliveryQuote;

    setIsCheckingDelivery(true);
    setDeliveryAddressError(null);

    try {
      const response = await fetch(getApiUrl("/api/validate-delivery-address"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerAddress: normalizedDeliveryAddress,
          restaurantAddress: settings.address,
        }),
      });
      const data = await readApiJson<DeliveryValidationResponse>(response, "We could not validate that delivery address.");

      const quote: DeliveryQuote = {
        address: normalizedDeliveryAddress,
        matchedCustomerAddress: data.matchedCustomerAddress || normalizedDeliveryAddress,
        distanceMeters: data.distanceMeters,
        withinFreeDeliveryRadius: Boolean(data.withinFreeDeliveryRadius),
        isFallback: data.isFallback,
      };

      setDeliveryQuote(quote);
      return quote;
    } catch (err: any) {
      setDeliveryAddressError(err.message || t("checkout.deliveryAddressValidationError"));
      return null;
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  const handleProceedToPayment = async () => {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.name = t("checkout.nameRequired") || "Name is required";
    if (!customerPhone.trim()) errors.phone = t("checkout.phoneRequired") || "Phone is required";
    if (orderType === "delivery" && !normalizedDeliveryAddress) {
      errors.delivery = t("checkout.deliveryAddressRequired") || "Delivery address is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const validatedQuote = await validateDeliveryAddress();
    if (orderType === "delivery" && !validatedQuote) return;

    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      const requestBody = {
        order_type: orderType,
        customer_info: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: orderType === "delivery" ? normalizedDeliveryAddress : undefined,
        },
        order_items: cart.map(({ item, variation, quantity }) => ({
          menu_item_id: item.id,
          variation_id: variation.id,
          quantity,
        })),
      };

      if (!isOnlinePaymentEnabled) {
        const response = await fetch(getApiUrl("/api/orders/manual"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const data = await readApiJson<ManualOrderResponse>(
          response,
          t("checkout.orderPlacementFailed"),
        );

        if (!data.orderId) {
          throw new Error(t("checkout.orderPlacementFailed"));
        }

        setOrderId(data.orderId);
        setOrderComplete(true);
        resetCheckoutState();
        clearStoredCheckout();
        return;
      }

      const response = await fetch(getApiUrl("/api/flatpay/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestBody,
          redirect_url_base: window.location.origin + "/cart" // Make sure redirect goes back to /cart page!
        }),
      });
      const data = await readApiJson<FlatpaySessionResponse>(response, t("checkout.paymentInitializationFailed"));

      if (!data.checkoutUrl) throw new Error(t("checkout.paymentInitializationFailed"));

      window.location.assign(data.checkoutUrl);
    } catch (err: any) {
      setPaymentError(
        err.message ||
          t(
            isOnlinePaymentEnabled
              ? "checkout.paymentInitializationFailed"
              : "checkout.orderPlacementFailed",
          ),
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fdfbf7] overflow-x-hidden pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Decorative backgrounds */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(var(--color-sumi) 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
      <div className="fixed -left-10 md:-left-20 top-1/4 opacity-[0.03] md:opacity-[0.04] pointer-events-none z-0 select-none">
        <span className="text-[20rem] md:text-[40rem] font-serif leading-none">味</span>
      </div>

      <AnimatePresence>
        {orderComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-sumi)]/80 backdrop-blur-sm px-6">
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[var(--color-washi)] p-12 max-w-md w-full text-center relative border border-[var(--color-shu)]/40 shadow-2xl"
            >
              <div className="w-16 h-16 bg-[var(--color-shu)] text-[var(--color-washi)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-[var(--color-sumi)] mb-4">{t("order.confirmed")}</h2>
              <p className="text-[var(--color-sumi)]/70 mb-2 text-sm leading-relaxed">
                {t(
                  isOnlinePaymentEnabled
                    ? "order.confirmedDesc"
                    : "order.confirmedManualDesc",
                )}
              </p>
              {orderId && (
                <p className="text-[var(--color-sumi)]/40 mb-8 text-xs tracking-wide">
                  {t("order.orderNumber")}: #{orderId.slice(-8).toUpperCase()}
                </p>
              )}
              <Link
                to="/order"
                onClick={() => { setOrderComplete(false); setOrderId(null); }}
                className="inline-block px-8 py-4 bg-[var(--color-sumi)] text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[var(--color-shu)] transition-colors w-full cursor-pointer"
              >
                {t("order.backToMenu")}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <Link to="/order" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-sumi)]/50 hover:text-[var(--color-shu)] transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t("order.backToMenu")}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-[var(--color-sumi)]/10 pb-6 relative">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[var(--color-sumi)] flex items-center gap-4">
              <ShoppingBag className="w-10 h-10 text-[var(--color-shu)]" /> {t("order.yourOrder")}
            </h1>
          </motion.div>

          <div className="bg-white/60 backdrop-blur-md shadow-xl shadow-[var(--color-sumi)]/5 border border-[var(--color-sumi)]/10 p-6 md:p-8">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--color-sumi)]/40 relative z-10">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-30" strokeWidth={1} />
                <p className="text-lg italic text-[var(--color-sumi)]/50 mb-2">{t("order.emptyCart")}</p>
                <Link to="/order" className="mt-4 px-8 py-3 bg-[var(--color-sumi)] text-[var(--color-washi)] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[var(--color-shu)] transition-colors">
                  {t("order.addItems")}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-sumi)]/10">
                <AnimatePresence mode="popLayout">
                  {cart.map(({ id, item, variation, quantity }) => (
                    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key={id} className="flex gap-4 py-6 first:pt-0 last:pb-0">
                      <div className="w-24 h-24 shrink-0 bg-[var(--color-sumi)]/5">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-sumi)]/20">
                            <RamenBowlIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-serif font-bold text-xl text-[var(--color-sumi)]">{item.name}</h3>
                            <p className="text-xs text-[var(--color-shu)] uppercase tracking-[0.15em] font-bold mt-1">{variation.label}</p>
                            <p className="text-sm text-[var(--color-sumi)]/60 line-clamp-1">{item.description}</p>
                          </div>
                          <span className="font-medium text-[var(--color-sumi)]/80">€{(variation.price * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => removeOneFromCart(id)} className="w-8 h-8 rounded-full border border-[var(--color-sumi)]/20 flex items-center justify-center text-[var(--color-sumi)] hover:bg-[var(--color-shu)] hover:border-[var(--color-shu)] hover:text-[var(--color-washi)] transition-colors">
                              <Minus size={16} />
                            </button>
                            <span className="font-medium text-[var(--color-sumi)] w-4 text-center">{quantity}</span>
                            <button onClick={() => addToCart(item, variation)} className="w-8 h-8 rounded-full border border-[var(--color-sumi)]/20 flex items-center justify-center text-[var(--color-sumi)] hover:bg-[var(--color-shu)] hover:border-[var(--color-shu)] hover:text-[var(--color-washi)] transition-colors">
                              <Plus size={16} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(id)} className="text-[var(--color-sumi)]/40 hover:text-[var(--color-shu)] text-[10px] uppercase tracking-widest transition-colors font-medium">
                            {t("order.remove")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Panel */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="sticky top-32 bg-[var(--color-sumi)] text-[var(--color-washi)] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 border border-[var(--color-shu)]/20 rounded-full flex items-center justify-center opacity-50 transform rotate-12 pointer-events-none">
              <div className="w-28 h-28 border border-[var(--color-shu)]/20 rounded-full flex items-center justify-center">
                <span className="text-[var(--color-shu)]/20 font-serif text-4xl">旨味</span>
              </div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[var(--color-washi)] pb-4 border-b border-[var(--color-washi)]/10 flex items-center gap-3 relative z-10">
              <RamenBowlIcon className="w-7 h-7 text-[var(--color-shu)]" strokeWidth={2} />
              {checkoutStep === "cart" ? t("order.total") : t("checkout.yourDetails")}
            </h2>

            {isVerifyingPaymentReturn && (
              <div className="relative z-10 mt-4 flex items-center gap-3 bg-[var(--color-washi)]/5 border border-[var(--color-washi)]/10 px-4 py-3 text-xs text-[var(--color-washi)]/70">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-[var(--color-shu)]/40 border-t-transparent rounded-full shrink-0" />
                <span>{t("checkout.paymentVerifying")}</span>
              </div>
            )}

            {checkoutStep === "cart" && (
              <div className="relative z-10 mt-6">
                <div className="space-y-4 mb-6">
                  {/* Order type toggle */}
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setOrderType("delivery")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] tracking-[0.15em] uppercase font-bold border transition-all ${orderType === "delivery" ? "border-[var(--color-shu)] bg-[var(--color-shu)]/10 text-[var(--color-shu)]" : "border-[var(--color-washi)]/20 text-[var(--color-washi)]/40 hover:border-[var(--color-washi)]/40"}`}>
                      <Truck size={16} /> {t("order.delivery")}
                    </button>
                    <button onClick={() => setOrderType("pickup")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] tracking-[0.15em] uppercase font-bold border transition-all ${orderType === "pickup" ? "border-[var(--color-shu)] bg-[var(--color-shu)]/10 text-[var(--color-shu)]" : "border-[var(--color-washi)]/20 text-[var(--color-washi)]/40 hover:border-[var(--color-washi)]/40"}`}>
                      <ShoppingBag size={16} /> {t("order.pickup")}
                    </button>
                  </div>

                  <div className="flex justify-between text-sm text-[var(--color-washi)]/70">
                    <span>{t("order.subtotal")}</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-washi)]/70">
                    <span>{t("order.deliveryFee")}</span>
                    <span>
                      {orderType === "pickup" || !isDeliveryFeeApplied ? t("order.free") : `€${deliveryFeeSetting.toFixed(2)}`}
                    </span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="text-[10px] text-[var(--color-washi)]/50 leading-relaxed border-l-2 border-[var(--color-shu)] pl-2">
                      <span className="text-[var(--color-shu)] font-medium">Free delivery</span> within {FREE_DELIVERY_RADIUS_METERS / 1000}km for orders over €{DELIVERY_FEE_THRESHOLD.toFixed(2)}.
                    </div>
                  )}

                  <div className="flex justify-between font-serif font-bold text-3xl text-[var(--color-washi)] pt-6 border-t border-[var(--color-washi)]/10">
                    <span>{t("order.total")}</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleProceedToCustomerInfo}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-[var(--color-shu)] text-[var(--color-washi)] font-serif text-xl tracking-wide hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("order.proceed")}
                </motion.button>
              </div>
            )}

            {checkoutStep === "customer-info" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 pt-6">
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">{t("checkout.name")} *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30" />
                      <input type="text" value={customerName} onChange={(e) => { setCustomerName(e.target.value); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" })); }} required placeholder={t("checkout.namePlaceholder")} className={`w-full bg-[var(--color-washi)]/[0.05] border text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors ${formErrors.name ? "border-red-500/50" : "border-[var(--color-washi)]/20"}`} />
                    </div>
                    {formErrors.name && (
                      <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                        <AlertCircle size={10} className="shrink-0" /> {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">{t("checkout.phone")} *</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30" />
                      <input type="tel" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: "" })); }} required placeholder="+358 44 123 4567" className={`w-full bg-[var(--color-washi)]/[0.05] border text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors ${formErrors.phone ? "border-red-500/50" : "border-[var(--color-washi)]/20"}`} />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                        <AlertCircle size={10} className="shrink-0" /> {formErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 mb-2">{t("checkout.email")}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-washi)]/30" />
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder={t("checkout.emailPlaceholder")} className="w-full bg-[var(--color-washi)]/[0.05] border border-[var(--color-washi)]/20 text-[var(--color-washi)] px-4 py-3 pl-10 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors" />
                    </div>
                  </div>
                  {orderType === "delivery" && (
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <label className="block text-[10px] tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50">{t("checkout.deliveryAddress")} *</label>
                        <button type="button" onClick={validateDeliveryAddress} disabled={isCheckingDelivery || !normalizedDeliveryAddress} className="text-[10px] tracking-[0.15em] uppercase font-bold text-[var(--color-shu)] hover:text-[#a02020] transition-colors disabled:opacity-30 mb-0.5">
                          {isCheckingDelivery ? t("checkout.checkingAddress") : t("checkout.checkAddress")}
                        </button>
                      </div>
                      <textarea value={deliveryAddress} onChange={(e) => { setDeliveryAddress(e.target.value); if (formErrors.delivery) setFormErrors(prev => ({ ...prev, delivery: "" })); }} required={orderType === "delivery"} placeholder={t("checkout.deliveryAddressPlaceholder")} className={`w-full bg-[var(--color-washi)]/[0.05] border text-[var(--color-washi)] px-4 py-3 text-sm placeholder:text-[var(--color-washi)]/20 focus:outline-none focus:border-[var(--color-shu)] transition-colors resize-none h-24 ${formErrors.delivery || deliveryAddressError ? "border-red-500/50" : "border-[var(--color-washi)]/20"}`} />
                      {(formErrors.delivery || deliveryAddressError) && (
                        <div className="flex items-center gap-2 text-[10px] text-red-400">
                          <AlertCircle size={10} className="shrink-0" /><span>{formErrors.delivery || deliveryAddressError}</span>
                        </div>
                      )}
                      {hasValidatedDeliveryQuote && deliveryQuote && !deliveryAddressError && (
                        <div className="flex items-center gap-2">
                          <Check size={14} className="shrink-0 text-[var(--color-washi)]" />
                          <span className="text-[10px] tracking-wide font-medium text-[var(--color-washi)]/80">
                            {!isDeliveryFeeApplied ? "Free delivery" : "Standard delivery pricing applies"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--color-washi)]/20 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-[var(--color-washi)]/50">
                    <span>{t("order.subtotal")}</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-washi)]/50">
                    <span>{t("order.deliveryFee")}</span>
                    <span>{orderType === "pickup" || !isDeliveryFeeApplied ? t("order.free") : `€${deliveryFeeSetting.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-serif font-bold text-2xl text-[var(--color-washi)] pt-2 border-t border-[var(--color-washi)]/10">
                    <span>{t("order.total")}</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isOnlinePaymentEnabled && (
                  <div className="mb-4 border border-[var(--color-washi)]/10 bg-[var(--color-washi)]/5 px-4 py-3 text-xs text-[var(--color-washi)]/70 leading-relaxed">
                    {t("checkout.manualOrderHint")}
                  </div>
                )}

                {paymentError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-3 mb-4">
                    <AlertCircle size={10} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-xs">{paymentError}</span>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3">
                  <motion.button 
                    onClick={handleProceedToPayment} 
                    disabled={isCreatingPayment} 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    className="relative overflow-hidden w-full py-4 bg-[var(--color-shu)] text-[var(--color-washi)] font-serif text-xl tracking-wide hover:bg-[#a02020] transition-colors disabled:opacity-50"
                  >
                    <span className={`transition-opacity duration-300 ${isCreatingPayment ? "opacity-0" : "opacity-100"}`}>
                      {t(
                        isOnlinePaymentEnabled
                          ? "checkout.proceedToPayment"
                          : "checkout.placeOrder",
                      )}
                    </span>
                    {isCreatingPayment && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" 
                        />
                      </span>
                    )}
                  </motion.button>
                  <button
                    onClick={() => setCheckoutStep("cart")}
                    className="w-full py-3 text-xs tracking-[0.2em] uppercase font-medium text-[var(--color-washi)]/50 hover:text-[var(--color-washi)] transition-all flex items-center justify-center gap-2 group/back"
                  >
                    <ArrowLeft size={14} className="group-hover/back:-translate-x-1 transition-transform" />
                    {t("checkout.backToCart")}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
