import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  UtensilsCrossed,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  ChefHat,
  XCircle,
  Bell,
  Filter,
  ShoppingBag,
  Settings,
  Globe,
  ChevronDown,
} from "lucide-react";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import {
  subscribeToOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "../services/orderService";
import { useTranslation } from "react-i18next";
import { logout } from "../services/authService";
import { AdminMenuManager } from "../components/AdminMenuManager";
import { AdminSettings } from "../components/AdminSettings";
import { AdminReservations } from "../components/AdminReservations";
import { BrandLogo } from "../components/BrandLogo";

type AdminTab = "orders" | "reservations" | "menu" | "settings";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: "New Order",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/30",
    icon: <Bell size={14} />,
  },
  preparing: {
    label: "Preparing",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30",
    icon: <ChefHat size={14} />,
  },
  ready: {
    label: "Ready",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/30",
    icon: <Package size={14} />,
  },
  completed: {
    label: "Completed",
    color: "text-[var(--color-washi)]/40",
    bgColor: "bg-[var(--color-washi)]/5 border-[var(--color-washi)]/10",
    icon: <CheckCircle2 size={14} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30",
    icon: <XCircle size={14} />,
  },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

function formatTimeAgo(timestamp: any): string {
  if (!timestamp?.toDate) return "";
  const now = new Date();
  const date = timestamp.toDate();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("fi-FI");
}

function formatTime(timestamp: any): string {
  if (!timestamp?.toDate) return "";
  return timestamp
    .toDate()
    .toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
}

export function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const prevOrderCountRef = useRef(0);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close lang menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Play notification sound for new orders
  const playNotification = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gain.gain.value = 0.3;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      if (
        prevOrderCountRef.current > 0 &&
        newOrders.length > prevOrderCountRef.current
      ) {
        playNotification();
      }
      prevOrderCountRef.current = newOrders.length;
      setOrders(newOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [playNotification]);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleCancel = (orderId: string) => {
    setOrderToCancel(orderId);
    setIsModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await updateOrderStatus(orderToCancel, "cancelled");
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
    setOrderToCancel(null);
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-[var(--color-sumi)] text-[var(--color-washi)] relative">
      {/* Background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-washi) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-sumi)]/80 backdrop-blur-xl border-b border-[var(--color-washi)]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <BrandLogo
                imageClassName="h-8 md:h-10 w-8 md:w-10 object-contain"
                textClassName="text-[10px] md:text-base font-bold tracking-[0.14em] text-[var(--color-washi)] line-clamp-1"
                subtextClassName="hidden md:block text-[9px] tracking-[0.22em] uppercase text-[var(--color-shu)]"
              />
              <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[var(--color-washi)]/50 whitespace-nowrap">
                  <div
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${activeOrders.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-[var(--color-washi)]/20"}`}
                  />
                  <span className="hidden xs:inline">{activeOrders.length} {t('admin.active')}</span>
                  <span className="xs:hidden">{activeOrders.length}</span>
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 md:px-2.5 md:py-1 text-amber-400 text-[10px] md:text-xs font-bold whitespace-nowrap">
                    <Bell size={10} className="md:w-3 md:h-3" />
                    <span>{pendingCount}</span>
                    <span className="hidden xs:inline ml-0.5">{t('admin.new')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Language Switcher */}
              <div
                className="flex items-center gap-2 border-r border-[var(--color-washi)]/10 pr-2 md:pr-4 relative"
                ref={langMenuRef}
              >
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--color-washi)]/80 hover:text-[var(--color-washi)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Globe size={12} /> {i18n.language.toUpperCase()}{" "}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${isLangMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-4 mt-2 w-32 bg-[var(--color-sumi)] border border-[var(--color-washi)]/10 shadow-xl py-2 z-50 rounded-sm"
                  >
                    <button
                      onClick={() => {
                        i18n.changeLanguage("fi");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-bold transition-colors cursor-pointer ${i18n.language === "fi" ? "text-[var(--color-shu)] bg-[var(--color-washi)]/5" : "text-[var(--color-washi)]/70 hover:bg-[var(--color-washi)]/5 hover:text-[var(--color-washi)]"}`}
                    >
                      Suomi
                    </button>
                    <button
                      onClick={() => {
                        i18n.changeLanguage("en");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-bold transition-colors cursor-pointer ${i18n.language === "en" ? "text-[var(--color-shu)] bg-[var(--color-washi)]/5" : "text-[var(--color-washi)]/70 hover:bg-[var(--color-washi)]/5 hover:text-[var(--color-washi)]"}`}
                    >
                      English
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] md:text-xs tracking-[0.15em] uppercase font-medium text-[var(--color-washi)]/50 hover:text-[var(--color-shu)] transition-colors cursor-pointer ml-1 md:ml-2"
            >
              <LogOut size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">{t('admin.signOut')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Second row on mobile, integrated on desktop */}
          <div className="flex border-t sm:border-t-0 border-[var(--color-washi)]/10 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <div className="flex py-2 sm:py-0">
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "orders"
                    ? "text-[var(--color-shu)] border-b-2 border-[var(--color-shu)] sm:bg-[var(--color-shu)] sm:text-[var(--color-washi)] sm:border-b-0"
                    : "text-[var(--color-washi)]/40 hover:text-[var(--color-washi)]/70"
                }`}
              >
                <ShoppingBag size={14} />
                <span>{t('admin.orders')}</span>
              </button>
              <button
                onClick={() => setActiveTab("reservations")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-bold transition-all cursor-pointer border-l border-[var(--color-washi)]/10 whitespace-nowrap ${
                  activeTab === "reservations"
                    ? "text-[var(--color-shu)] border-b-2 border-[var(--color-shu)] sm:bg-[var(--color-shu)] sm:text-[var(--color-washi)] sm:border-b-0"
                    : "text-[var(--color-washi)]/40 hover:text-[var(--color-washi)]/70"
                }`}
              >
                <Calendar size={14} />
                <span>{t('reservations.tag')}</span>
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-bold transition-all cursor-pointer border-l border-[var(--color-washi)]/10 whitespace-nowrap ${
                  activeTab === "menu"
                    ? "text-[var(--color-shu)] border-b-2 border-[var(--color-shu)] sm:bg-[var(--color-shu)] sm:text-[var(--color-washi)] sm:border-b-0"
                    : "text-[var(--color-washi)]/40 hover:text-[var(--color-washi)]/70"
                }`}
              >
                <UtensilsCrossed size={14} />
                <span>{t('admin.menu')}</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-bold transition-all cursor-pointer border-l border-[var(--color-washi)]/10 whitespace-nowrap ${
                  activeTab === "settings"
                    ? "text-[var(--color-shu)] border-b-2 border-[var(--color-shu)] sm:bg-[var(--color-shu)] sm:text-[var(--color-washi)] sm:border-b-0"
                    : "text-[var(--color-washi)]/40 hover:text-[var(--color-washi)]/70"
                }`}
              >
                <Settings size={14} />
                <span>{t('admin.settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "orders" ? (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <Filter
                  size={14}
                  className="text-[var(--color-washi)]/30 shrink-0"
                />
                {(
                  [
                    "all",
                    "pending",
                    "preparing",
                    "ready",
                    "completed",
                    "cancelled",
                  ] as const
                ).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 text-xs tracking-[0.15em] uppercase font-medium whitespace-nowrap transition-all cursor-pointer border ${
                      filter === status
                        ? "bg-[var(--color-shu)] border-[var(--color-shu)] text-[var(--color-washi)]"
                        : "border-[var(--color-washi)]/10 text-[var(--color-washi)]/40 hover:border-[var(--color-washi)]/10 hover:text-[var(--color-washi)]/70"
                    }`}
                  >
                    {status === "all"
                      ? `${t('admin.all')} (${orders.length})`
                      : `${t(`admin.${status}`)} (${orders.filter((o) => o.status === status).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--color-washi)]/40 text-xs tracking-[0.2em] uppercase">
                      {t('admin.loadingOrders')}
                    </p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <Package
                      size={48}
                      className="text-[var(--color-washi)]/10 mx-auto mb-4"
                    />
                    <p className="text-[var(--color-washi)]/30 text-sm">
                      {t('admin.noOrdersStr1')}
                    </p>
                    <p className="text-[var(--color-washi)]/15 text-xs mt-1">
                      {t('admin.noOrdersStr2')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.map((order) => {
                      const config = STATUS_CONFIG[order.status];
                      const nextStatus = NEXT_STATUS[order.status];

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={order.id}
                          className={`bg-[var(--color-washi)]/[0.03] border border-[var(--color-washi)]/10 p-5 relative group hover:border-[var(--color-washi)]/10 transition-colors ${
                            order.status === "pending"
                              ? "ring-1 ring-amber-400/20"
                              : ""
                          }`}
                        >
                          {/* Status badge + time */}
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold ${config.bgColor} ${config.color}`}
                            >
                              {config.icon}
                              {t(`admin.${order.status}`)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-washi)]/30 text-xs">
                              <Clock size={12} />
                              {formatTimeAgo(order.created_at)}
                            </div>
                          </div>

                          {/* Order ID */}
                          <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-washi)]/25 mb-3">
                            #{order.id?.slice(-6).toUpperCase()}
                          </div>

                          {/* Customer info */}
                          <div className="mb-4 border-b border-[var(--color-washi)]/10 pb-3">
                            <p className="font-serif font-bold text-[var(--color-washi)] text-base">
                              {order.customer_info?.name || t('admin.guest')}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-washi)]/40">
                              {order.customer_info?.phone && (
                                <span>{order.customer_info.phone}</span>
                              )}
                              {order.customer_info?.email && (
                                <span>{order.customer_info.email}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 border ${
                                  order.order_type === "delivery"
                                    ? "border-blue-400/30 text-blue-400 bg-blue-400/10"
                                    : "border-emerald-400/30 text-emerald-400 bg-emerald-400/10"
                                }`}
                              >
                                {order.order_type === "delivery" ? t('nav.delivery') : "Pickup"}
                              </span>
                              <span
                                className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 border ${
                                  order.payment_status === "paid"
                                    ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10"
                                    : "border-amber-400/30 text-amber-400 bg-amber-400/10"
                                }`}
                              >
                                {order.payment_status === "paid" ? t('admin.paid') : t('admin.unpaid')}
                              </span>
                            </div>
                            {order.order_type === "delivery" && order.customer_info?.address && (
                              <p className="mt-2 text-xs text-[var(--color-washi)]/45 whitespace-pre-line leading-relaxed">
                                {order.customer_info.address}
                              </p>
                            )}
                          </div>

                          {/* Items */}
                          <div className="space-y-2 mb-4">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-[var(--color-washi)]/70">
                                  <span className="text-[var(--color-shu)] font-bold mr-1.5">
                                    {item.quantity}×
                                  </span>
                                  {item.name}
                                </span>
                                <span className="text-[var(--color-washi)]/40">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Price Breakdown */}
                          <div className="pt-4 mt-4 border-t border-[var(--color-washi)]/10 space-y-2">
                            <div className="flex justify-between items-center text-xs text-[var(--color-washi)]/40">
                              <span>{t('order.subtotal')}</span>
                              <span>€{(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                            {order.order_type === "delivery" && (
                              <div className="flex justify-between items-center text-xs text-[var(--color-washi)]/40">
                                <span>{t('order.deliveryFee')}</span>
                                <span>€{(order.delivery_fee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--color-washi)]/10">
                              <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-washi)]/60 font-bold">
                                {t('admin.total')}
                              </span>
                              <span className="font-serif font-bold text-xl text-[var(--color-washi)]">
                                €{((order.total_amount || 0) + (order.delivery_fee || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>



                          {/* Actions */}
                          {!["completed", "cancelled"].includes(
                            order.status,
                          ) && (
                            <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--color-washi)]/10">
                              {nextStatus && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(order.id!, nextStatus)
                                  }
                                  className="flex-1 py-2.5 bg-[var(--color-shu)] text-[var(--color-washi)] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#a02020] transition-colors cursor-pointer"
                                >
                                  {t(`admin.${nextStatus}`)}
                                </button>
                              )}
                              <button
                                onClick={() => handleCancel(order.id!)}
                                className="px-4 py-2.5 border border-red-400/30 text-red-400 text-xs tracking-[0.15em] uppercase font-bold hover:bg-red-400/10 transition-colors cursor-pointer"
                              >
                                {t('admin.cancel')}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === "reservations" ? (
          <motion.div
            key="reservations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <AdminReservations />
          </motion.div>
        ) : activeTab === "menu" ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <AdminMenuManager />
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-4 md:p-8"
          >
            <AdminSettings />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will send an automated notification to the customer and cannot be undone."
        confirmLabel="Cancel Order"
        cancelLabel="Dismiss"
      />
    </div>
  );
}
