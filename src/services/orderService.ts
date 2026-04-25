import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  menu_item_id: string;
  variation_id?: string;
  variation_label?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

export interface Order {
  id?: string;
  customer_info: CustomerInfo;
  items: OrderItem[];
  total_amount: number;
  delivery_fee: number;
  order_type: 'delivery' | 'pickup';
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  payment_provider?: 'flatpay';
  payment_reference?: string;
  flatpay_invoice_handle?: string;
  flatpay_session_id?: string;
  delivery_distance_meters?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

const COLLECTION = 'orders';

/**
 * Legacy client-side helper for unpaid/manual flows.
 * Secure paid orders are now created by the backend after Flatpay verification.
 */
export async function createOrder(
  customerInfo: CustomerInfo,
  items: OrderItem[],
  totalAmount: number,
  deliveryFee: number,
  orderType: 'delivery' | 'pickup',
  paymentIntentId?: string,
  deliveryDistanceMeters?: number,
): Promise<string> {
  const now = Timestamp.now();
  const orderData: Omit<Order, 'id'> = {
    customer_info: customerInfo,
    items,
    total_amount: totalAmount,
    delivery_fee: deliveryFee,
    order_type: orderType,
    status: 'pending',
    payment_status: paymentIntentId ? 'paid' : 'unpaid',
    payment_intent_id: paymentIntentId || undefined,
    delivery_distance_meters: deliveryDistanceMeters,
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), orderData);
  return docRef.id;
}

/**
 * Fetch all orders (admin), ordered by creation date descending.
 */
export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

/**
 * Subscribe to real-time order updates (admin dashboard).
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  });
}

/**
 * Update order status (admin).
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update order status');
  }
}

/**
 * Update payment status (called by webhook handler or admin).
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  const ref = doc(db, COLLECTION, orderId);
  await updateDoc(ref, {
    payment_status: paymentStatus,
    updated_at: Timestamp.now(),
  });
}
