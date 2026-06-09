import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getAdminApp, isFirebaseAdminConfigured } from './server/firebaseAdmin.js';

// Load environment variables. .env.local takes precedence over .env for safe local development.
dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FREE_DELIVERY_RADIUS_METERS = 5000;
const DELIVERY_FEE_THRESHOLD = 20;
const DEFAULT_DELIVERY_FEE = 3;
const DEFAULT_RESTAURANT_ADDRESS = 'Kuskinkatu 3\n20780 Kaarina, Finland';
const ORDERS_COLLECTION = 'orders';
const RESERVATIONS_COLLECTION = 'reservations';
const MENU_COLLECTION = 'menu_items';
const PENDING_CHECKOUTS_COLLECTION = 'pending_checkouts';
const SETTINGS_DOC_PATH = 'settings/general';
const RESERVATION_TIME_ZONE = 'Europe/Helsinki';
const RESERVATION_EDIT_CUTOFF_MINUTES = 240;
const STRIPE_PAYMENT_SUCCESS_STATUSES = new Set(['paid', 'no_payment_required']);
const ORDER_STATUSES = new Set(['pending', 'preparing', 'ready', 'completed', 'cancelled']);
const RESERVATION_STATUSES = new Set(['pending', 'confirmed', 'cancelled']);

// ============================================================================
// CACHING - Reduce Firestore reads and redundant API calls
// ============================================================================

// In-memory cache for settings/general (60-second TTL)
let _settingsCache: { data: SiteSettingsRecord; expiry: number } | null = null;
const SETTINGS_CACHE_TTL_MS = 60_000;

// In-memory cache for the restaurant's geocoded coordinates (effectively permanent)
let _restaurantGeoCache: { coordinates: [number, number]; label: string; address: string } | null = null;

// ============================================================================
// RATE LIMITING - Protect against abuse and API cost explosion
// ============================================================================

// General API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Geocoding endpoint: stricter limit (Nominatim allows 1 req/sec)
// 20 requests per minute per IP
const geocodingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { 
    error: 'Too many address validation requests. Please wait a moment and try again.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Checkout session creation: very strict (prevents cost abuse)
// 5 sessions per 15 minutes per IP
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: { 
    error: 'Too many checkout attempts. Please wait before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

type OrderType = 'delivery' | 'pickup';
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
type PendingCheckoutStatus =
  | 'creating_session'
  | 'payment_pending'
  | 'paid'
  | 'cancelled'
  | 'failed';
type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

interface MenuItemRecord {
  name?: string;
  price?: number;
  is_available?: boolean;
  image_url?: string;
  variations?: {
    id?: string;
    label?: string;
    price?: number;
  }[];
}

interface SiteSettingsRecord {
  address?: string;
  deliveryFee?: number;
  restaurantName?: string;
}

interface CheckoutItemInput {
  menu_item_id?: string;
  id?: string;
  variation_id?: string;
  quantity?: number;
}

interface CustomerInfoInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface OrderItemSnapshot {
  menu_item_id: string;
  variation_id?: string;
  variation_label?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface PendingCheckoutRecord {
  handle: string;
  status: PendingCheckoutStatus;
  payment_provider: 'stripe';
  payment_status: PaymentStatus;
  customer_info: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    matched_address?: string;
  };
  items: OrderItemSnapshot[];
  subtotal_amount: number;
  delivery_fee: number;
  total_amount: number;
  order_type: OrderType;
  delivery_distance_meters?: number;
  stripe_session_id?: string;
  stripe_checkout_url?: string;
  stripe_payment_status?: string;
  stripe_payment_intent_id?: string;
  payment_reference?: string;
  final_order_id?: string;
  last_error?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

interface ValidatedCheckout {
  customerInfo: PendingCheckoutRecord['customer_info'];
  items: OrderItemSnapshot[];
  orderType: OrderType;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDistanceMeters?: number;
  restaurantAddress: string;
}

interface CheckoutSyncResult {
  outcome:
    | 'paid'
    | 'pending'
    | 'cancelled'
    | 'failed'
    | 'missing_checkout'
    | 'missing_payment';
  orderId?: string;
  paymentState?: string;
}

interface CreatedOrderResult {
  orderId: string;
}

interface ReservationRecord {
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  time: string;
  guests: number;
  special_requests: string;
  status: ReservationStatus;
  manage_token_hash: string;
  customer_edit_count?: number;
  last_customer_action_at?: Timestamp;
  cancelled_at?: Timestamp;
  cancelled_by?: 'customer' | 'admin';
  created_at: Timestamp;
  updated_at: Timestamp;
}

interface ReservationEmailInput {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  status?: ReservationStatus;
}

interface ReservationSelfServiceState {
  canManage: boolean;
  canEdit: boolean;
  canCancel: boolean;
  reason?: string;
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);

    const parsedHostname = parsed.hostname.replace(/^www\./, '');
    if (
      (parsedHostname === 'localhost' || parsedHostname === '127.0.0.1') &&
      ['http:', 'https:'].includes(parsed.protocol)
    ) {
      return true;
    }

    // Default production domain fallback
    if (parsedHostname === 'sumisushiandpoke.fi') {
      return true;
    }

    const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
    if (configuredBaseUrl) {
      const configuredHostname = new URL(configuredBaseUrl).hostname.replace(/^www\./, '');
      if (parsedHostname === configuredHostname) {
        return true;
      }
    }

    // On Vercel, the VERCEL_URL env var is set automatically.
    // Allow the deployment URL as a valid origin so that same-origin
    // browser requests (which include an Origin header) are not rejected.
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      const vercelOrigin = `https://${vercelUrl}`;
      if (parsed.origin === new URL(vercelOrigin).origin) {
        return true;
      }
      // Also allow *.vercel.app preview deployments for the same project
      if (parsed.hostname.endsWith('.vercel.app') && parsed.protocol === 'https:') {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS.'));
    },
  }),
);

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

function requireAdminDb() {
  const db = getAdminDb();
  if (!db) {
    throw new Error(
      'Firebase Admin is not configured. Add service-account credentials before using secure payments.',
    );
  }
  return db;
}

async function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase Admin not initialized');
    }
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);

    // SECURITY FIX: Verify the user actually has an admin role in Firestore.
    // Previously, any authenticated Firebase user could call admin endpoints.
    const db = requireAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      console.warn(`Auth Rejected: User ${decodedToken.uid} (${decodedToken.email}) is not an admin.`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured.');
  }
  return new Stripe(secretKey);
}

function createBasicAuthorizationHeader(secret: string): string {
  return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
}

function createNlsAuthorizationHeader(apiKey: string): string {
  return createBasicAuthorizationHeader(apiKey);
}

function getPublicAppBaseUrl(req: express.Request): string {
  let baseUrl = process.env.APP_BASE_URL?.trim();

  if (!baseUrl) {
    if (typeof req.headers.origin === 'string' && req.headers.origin) {
      baseUrl = req.headers.origin.trim();
    } else if (typeof req.headers.referer === 'string' && req.headers.referer) {
      try {
        baseUrl = new URL(req.headers.referer).origin;
      } catch {
        // Ignore invalid referer
      }
    }
  }

  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }

  // Ensure the URL always starts with an explicit scheme (e.g. http:// or https://) for APIs like Stripe
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = `http://${baseUrl}`;
    } else {
      baseUrl = `https://${baseUrl}`;
    }
  }

  return baseUrl.replace(/\/+$/, '');
}

function getAdminDashboardUrl(req?: express.Request): string {
  const baseUrl = req ? getPublicAppBaseUrl(req) : process.env.APP_BASE_URL?.trim() || 'http://localhost:3000';
  return `${baseUrl.replace(/\/+$/, '')}/admin`;
}

function logEmailDebug(message: string) {
  const logMsg = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'email_debug.log'), logMsg);
  } catch (err) {
    console.error('Failed to write to email_debug.log:', err);
  }
}

function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'Guest', lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  
  const trimmed = value.trim();
  
  // Prevent excessively long inputs (DoS protection)
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength);
  }
  
  return trimmed;
}

/**
 * Escape HTML special characters to prevent injection in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function createCheckoutHandle(): string {
  const randomPart = randomUUID().replace(/-/g, '').slice(0, 12);
  return `web-${Date.now()}-${randomPart}`;
}

async function getSiteSettings() {
  try {
    const db = requireAdminDb();
    const snapshot = await db.doc(SETTINGS_DOC_PATH).get();
    if (snapshot.exists) {
      return snapshot.data() as any;
    }
  } catch (error) {
    console.error('Error fetching settings for email:', error);
  }
  return {
    restaurantName: 'Sumi Sushi and Poke',
    contactPhone: '044 2479393',
    address: 'Kuskinkatu 3, 20780 Kaarina'
  };
}

/**
 * Geocode and cache the restaurant's address. The restaurant doesn't move,
 * so we cache this permanently in memory to avoid redundant Nominatim calls.
 */
async function getRestaurantGeocode(restaurantAddress: string): Promise<{ coordinates: [number, number]; label: string } | null> {
  if (_restaurantGeoCache && _restaurantGeoCache.address === restaurantAddress) {
    return { coordinates: _restaurantGeoCache.coordinates, label: _restaurantGeoCache.label };
  }

  const result = await geocodeFinnishAddress(restaurantAddress);
  if (result) {
    _restaurantGeoCache = { ...result, address: restaurantAddress };
  }
  return result;
}

function isValidPhone(phone: string): boolean {
  return phone.length >= 6;
}

function buildOrderText(items: OrderItemSnapshot[]): string {
  const summary = items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
  return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
}

/**
 * Recursively strips properties with `undefined` values from an object.
 * Firestore does not accept `undefined` as a field value; this prevents
 * "Cannot use 'undefined' as a Firestore value" errors when optional
 * fields (e.g. image_url on menu items without images) are missing.
 */
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  }
  return result as T;
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createReservationManageToken(): string {
  return randomBytes(32).toString('hex');
}

function hashReservationManageToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getReservationManageUrl(
  reservationId: string,
  manageToken: string,
  req?: express.Request,
): string {
  const baseUrl = req ? getPublicAppBaseUrl(req) : process.env.APP_BASE_URL?.trim() || 'http://localhost:3000';
  const params = new URLSearchParams({
    id: reservationId,
    token: manageToken,
  });

  return `${baseUrl.replace(/\/+$/, '')}/reservations/manage?${params.toString()}`;
}

function isValidReservationDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map((part) => parseInt(part, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
}

function isValidReservationTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10));
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function toReservationWallClockMillis(date: string, time: string): number {
  if (!isValidReservationDate(date) || !isValidReservationTime(time)) {
    return Number.NaN;
  }

  const [year, month, day] = date.split('-').map((part) => parseInt(part, 10));
  const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10));
  return Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
}

function getCurrentWallClockMillis(timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date());
  const getPart = (type: string) =>
    parseInt(parts.find((entry) => entry.type === type)?.value || '0', 10);

  return Date.UTC(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    getPart('hour'),
    getPart('minute'),
    getPart('second'),
    0,
  );
}

function getReservationMinutesUntil(date: string, time: string): number {
  const reservationMillis = toReservationWallClockMillis(date, time);
  if (Number.isNaN(reservationMillis)) {
    return Number.NaN;
  }

  const nowMillis = getCurrentWallClockMillis(RESERVATION_TIME_ZONE);
  return Math.floor((reservationMillis - nowMillis) / 60000);
}

function validateReservationSchedule(date: string, time: string): string | null {
  if (!isValidReservationDate(date)) {
    return 'Please choose a valid reservation date.';
  }

  if (!isValidReservationTime(time)) {
    return 'Please choose a valid reservation time.';
  }

  if (getReservationMinutesUntil(date, time) <= 0) {
    return 'Please choose a reservation time in the future.';
  }

  return null;
}

function getReservationSelfServiceState(
  reservation: Pick<ReservationRecord, 'status' | 'date' | 'time'>,
): ReservationSelfServiceState {
  if (reservation.status === 'cancelled') {
    return {
      canManage: false,
      canEdit: false,
      canCancel: false,
      reason: 'This reservation has already been cancelled.',
    };
  }

  const minutesUntilReservation = getReservationMinutesUntil(reservation.date, reservation.time);

  if (Number.isNaN(minutesUntilReservation) || minutesUntilReservation <= 0) {
    return {
      canManage: false,
      canEdit: false,
      canCancel: false,
      reason: 'This reservation time has already passed.',
    };
  }

  if (minutesUntilReservation <= RESERVATION_EDIT_CUTOFF_MINUTES) {
    return {
      canManage: true,
      canEdit: false,
      canCancel: true,
      reason: `Online edits close ${Math.floor(RESERVATION_EDIT_CUTOFF_MINUTES / 60)} hours before the reservation time. Please call the restaurant for changes.`,
    };
  }

  return {
    canManage: true,
    canEdit: true,
    canCancel: true,
  };
}

function serializeManagedReservation(
  reservationId: string,
  reservation: ReservationRecord,
  settings?: { contactPhone?: string },
) {
  const selfService = getReservationSelfServiceState(reservation);

  return {
    reservation: {
      id: reservationId,
      customerName: reservation.customer_info.name,
      customerEmail: reservation.customer_info.email,
      customerPhone: reservation.customer_info.phone,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      specialRequests: reservation.special_requests || '',
      status: reservation.status,
      createdAt: reservation.created_at?.toDate?.()?.toISOString?.() || null,
      updatedAt: reservation.updated_at?.toDate?.()?.toISOString?.() || null,
    },
    permissions: {
      ...selfService,
      contactPhone: settings?.contactPhone || '044 2479393',
      editCutoffHours: Math.floor(RESERVATION_EDIT_CUTOFF_MINUTES / 60),
    },
  };
}

async function getManagedReservation(
  reservationIdInput: unknown,
  manageTokenInput: unknown,
): Promise<{ ref: FirebaseFirestore.DocumentReference; reservationId: string; reservation: ReservationRecord }> {
  const reservationId = sanitizeString(reservationIdInput, 128);
  const manageToken = sanitizeString(manageTokenInput, 256);

  if (!reservationId || !manageToken) {
    const error = new Error('Missing reservation link details.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const db = requireAdminDb();
  const ref = db.collection(RESERVATIONS_COLLECTION).doc(reservationId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    const error = new Error('Reservation not found or the manage link is invalid.');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const reservation = snapshot.data() as ReservationRecord;
  const hashedToken = hashReservationManageToken(manageToken);

  if (!reservation.manage_token_hash || !secureCompare(hashedToken, reservation.manage_token_hash)) {
    const error = new Error('Reservation not found or the manage link is invalid.');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  return { ref, reservationId, reservation };
}

// Regex for Finnish address validation
// Matches patterns like: Streetname 123, 12345 City, Finland
// or variations with optional apartment/floor info
// Updated: Made comma optional to support "Street 3 12345 City" format
const FINNISH_ADDRESS_REGEX = /^[a-zA-ZäöÅÖÄ\s\-'.]+?\s+\d+[a-zA-Z]?(?:\s*[,\-]\s*(?:A|B|C|D|E|F|G|H|J|K|L|M|N|O|P|R|S|T|U|V|W|X|Y|Z|Ä|Ö)\d*)?[,\s\\n]+\s*\d{4,5}\s+[a-zA-ZäöÅÖÄ\s\-'.]+(?:[,\\n]+\s*Finland)?$/i;

/**
 * Normalizes an address for comparison by:
 * - Converting to lowercase
 * - Removing extra whitespace
 * - Standardizing separators (commas, newlines)
 * - Removing "Finland" suffix for comparison
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*finland$/i, '')
    .replace(/\bfinland\b/i, '')
    .trim();
}

/**
 * Validates if an address matches Finnish address format
 * Returns true if the address appears to be a valid Finnish address
 */
function isValidFinnishAddress(address: string): boolean {
  // Minimum length check
  if (address.length < 10) {
    return false;
  }
  
  // Must contain a postal code (4-5 digits)
  if (!/\b\d{4,5}\b/.test(address)) {
    return false;
  }
  
  // Must contain at least one letter (street name)
  if (!/[a-zA-ZäöÅÖÄ]/.test(address)) {
    return false;
  }
  
  // Must contain at least one number (street number)
  if (!/\d/.test(address)) {
    return false;
  }
  
  // Check against the regex pattern
  return FINNISH_ADDRESS_REGEX.test(address.trim());
}

/**
 * Checks if two addresses are essentially the same after normalization
 * This handles cases where the same address is entered with different formatting
 */
function addressesMatch(address1: string, address2: string): boolean {
  const norm1 = normalizeAddress(address1);
  const norm2 = normalizeAddress(address2);
  
  // Exact match after normalization
  return norm1 === norm2;
}

function normalizeDeliveryFee(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_DELIVERY_FEE;
  }

  if (value === 3.9) {
    return DEFAULT_DELIVERY_FEE;
  }

  return value;
}

// ============================================================================
// NOMINATIM (OpenStreetMap) GEOCODING - PRIMARY (FREE, NO API KEY)
// ============================================================================

async function geocodeFinnishAddress(address: string): Promise<{
  coordinates: [number, number];
  label: string;
} | null> {
  // Clean address to remove staircase/flat numbers (e.g. "yo-kylä 23a, 22" -> "yo-kylä 23a")
  const parts = address
    .split(/[,\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const cleanedParts = parts.filter((part) => {
    const p = part.toLowerCase();
    if (/^\d{5}$/.test(p)) return true;
    if (/^\d+$/.test(p)) return false;
    if (/^[a-h]\s*\d+$/i.test(p) || /^(as|asunto|apt|apartment|fl|flat)\s*\d+$/i.test(p)) {
      return false;
    }
    return true;
  });

  let cleanedAddress = cleanedParts.join(', ');
  cleanedAddress = cleanedAddress
    .replace(/\b[A-H]\s*\d+\b/gi, '') // Removes "A 22", "B 4"
    .replace(/\b(as|asunto|apt|apartment|fl|flat)\s*\d+\b/gi, '') // Removes "as 22"
    .replace(/\b(\d+[a-zA-Z]?)-\d+\b/g, '$1') // Removes hyphenated apartments "3a-7" -> "3a"
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
  cleanedAddress = cleanedAddress.replace(/^,|,$/g, '').trim();

  // Nominatim uses lat/lon (WGS84), not EPSG:3067
  const url = new URL('https://nominatim.openstreetmap.org/search');
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', cleanedAddress);
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'fi'); // Restrict to Finland for better accuracy

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    console.log(`[Geocoding] Nominatim: "${address.replace(/\n/g, ', ')}" ➔ "${cleanedAddress}"`);
    const response = await fetch(url.toString(), {
      signal: controller.signal as any,
      headers: { 
        'User-Agent': 'SumiSushiDelivery/1.0',
        'Accept': 'application/json' 
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Geocoding] Nominatim error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`[Geocoding] No results from Nominatim for: "${address}"`);
      return null;
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lon)) {
      console.error('[Geocoding] Invalid coordinates from Nominatim');
      return null;
    }

    const label = result.display_name || address;

    console.log(`[Geocoding] ✅ Found: ${label.split(',')[0]}`);
    return {
      coordinates: [lat, lon],
      label,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[Geocoding] Nominatim request timed out for: "${address}"`);
    } else {
      console.error(`[Geocoding] Nominatim fetch failed: ${error.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculate distance using Haversine formula (for lat/lon coordinates)
 * More accurate for geographic coordinates than Euclidean distance
 */
function getDistanceMeters(from: [number, number], to: [number, number]): number {
  const R = 6371000; // Earth's radius in meters
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

async function fetchSiteSettings(): Promise<SiteSettingsRecord> {
  // Return cached settings if still valid (60s TTL)
  if (_settingsCache && Date.now() < _settingsCache.expiry) {
    return _settingsCache.data;
  }

  const db = requireAdminDb();
  const snapshot = await db.doc(SETTINGS_DOC_PATH).get();

  const defaults: SiteSettingsRecord = {
    address: DEFAULT_RESTAURANT_ADDRESS,
    deliveryFee: DEFAULT_DELIVERY_FEE,
    restaurantName: 'SUMI SUSHI AND POKE',
  };

  const data = snapshot.exists ? (snapshot.data() as SiteSettingsRecord) : defaults;
  _settingsCache = { data, expiry: Date.now() + SETTINGS_CACHE_TTL_MS };
  return data;
}

async function validateCheckoutPayload(payload: {
  customer_info?: CustomerInfoInput;
  order_items?: CheckoutItemInput[];
  order_type?: OrderType;
}): Promise<ValidatedCheckout> {
  const db = requireAdminDb();
  const customerInfoInput = payload.customer_info || {};
  const rawCart = Array.isArray(payload.order_items) ? payload.order_items : [];
  const orderType = payload.order_type === 'pickup' ? 'pickup' : 'delivery';

  const customerName = sanitizeString(customerInfoInput.name);
  const customerPhone = sanitizeString(customerInfoInput.phone);
  const customerEmail = sanitizeString(customerInfoInput.email);
  const customerAddress = sanitizeString(customerInfoInput.address);

  if (!customerName) {
    throw new Error('Customer name is required.');
  }

  if (!customerPhone || !isValidPhone(customerPhone)) {
    throw new Error('A valid phone number is required.');
  }

  if (orderType === 'delivery' && !customerAddress) {
    throw new Error('Delivery address is required for delivery orders.');
  }

  if (rawCart.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const normalizedCart = rawCart.map((entry) => {
    const menuItemId = sanitizeString(entry.menu_item_id || entry.id);
    const variationId = sanitizeString(entry.variation_id);
    const quantity = Number(entry.quantity || 0);

    if (!menuItemId) {
      throw new Error('One or more cart items are missing a menu item id.');
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
      throw new Error('One or more cart item quantities are invalid.');
    }

    return { menu_item_id: menuItemId, variation_id: variationId || undefined, quantity };
  });

  const dedupedIds = [...new Set(normalizedCart.map((item) => item.menu_item_id))];
  const menuRefs = dedupedIds.map((id) => db.collection(MENU_COLLECTION).doc(id));
  const [settings, menuSnapshots] = await Promise.all([
    fetchSiteSettings(),
    db.getAll(...menuRefs),
  ]);

  const menuMap = new Map<string, MenuItemRecord | null>(
    menuSnapshots.map((snapshot) => [
      snapshot.id,
      snapshot.exists ? (snapshot.data() as MenuItemRecord) : null,
    ]),
  );

  const items: OrderItemSnapshot[] = normalizedCart.map((item) => {
    const menuRecord = menuMap.get(item.menu_item_id);

    if (!menuRecord) {
      throw new Error(`Menu item "${item.menu_item_id}" no longer exists.`);
    }

    if (menuRecord.is_available === false) {
      throw new Error(`"${menuRecord.name || item.menu_item_id}" is currently unavailable.`);
    }

    const variations = Array.isArray(menuRecord.variations)
      ? menuRecord.variations.filter(
          (variation) =>
            variation.id &&
            variation.label &&
            typeof variation.price === 'number' &&
            !Number.isNaN(variation.price),
        )
      : [];
    const selectedVariation = variations.length > 0
      ? variations.find((variation) => variation.id === item.variation_id) || (!item.variation_id ? variations[0] : undefined)
      : undefined;
    const price = selectedVariation?.price ?? menuRecord.price;
    const variationLabel = selectedVariation?.label;

    if (variations.length > 0 && item.variation_id && !selectedVariation) {
      throw new Error(`"${menuRecord.name || item.menu_item_id}" has an invalid size selection.`);
    }

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new Error(`"${menuRecord.name || item.menu_item_id}" has an invalid price.`);
    }

    const snapshot: OrderItemSnapshot = {
      menu_item_id: item.menu_item_id,
      variation_id: selectedVariation?.id,
      variation_label: variationLabel,
      name: variationLabel ? `${menuRecord.name || item.menu_item_id} (${variationLabel})` : menuRecord.name || item.menu_item_id,
      price,
      quantity: item.quantity,
    };
    if (menuRecord.image_url) {
      snapshot.image_url = menuRecord.image_url;
    }
    return snapshot;
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const restaurantAddress = sanitizeString(settings.address) || DEFAULT_RESTAURANT_ADDRESS;
  const configuredDeliveryFee = normalizeDeliveryFee(settings.deliveryFee);

  let deliveryDistanceMeters: number | undefined;
  let matchedCustomerAddress: string | undefined;

  if (orderType === 'delivery') {
    if (addressesMatch(customerAddress, restaurantAddress)) {
      console.log('[Checkout] Addresses match - setting distance to 0 (free delivery)');
      deliveryDistanceMeters = 0;
      matchedCustomerAddress = customerAddress;
    } else {
      // Use cached restaurant geocode to avoid redundant Nominatim calls
      const [customerLocation, restaurantLocation] = await Promise.all([
        geocodeFinnishAddress(customerAddress),
        getRestaurantGeocode(restaurantAddress),
      ]);

      if (!customerLocation || !restaurantLocation) {
        throw new Error('We could not verify your delivery address. Please check the spelling or add a city/postal code.');
      }

      deliveryDistanceMeters = getDistanceMeters(
        customerLocation.coordinates,
        restaurantLocation.coordinates,
      );
      matchedCustomerAddress = customerLocation.label;
    }
  }

  const isWithinFreeRadius =
    (deliveryDistanceMeters || Number.POSITIVE_INFINITY) <= FREE_DELIVERY_RADIUS_METERS;
  const isOverThreshold = subtotal >= DELIVERY_FEE_THRESHOLD;

  const deliveryFee =
    orderType === 'delivery' && (!isWithinFreeRadius || !isOverThreshold)
      ? configuredDeliveryFee
      : 0;

  return {
    customerInfo: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: orderType === 'delivery' ? customerAddress : undefined,
      matched_address: matchedCustomerAddress,
    },
    items,
    orderType,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryDistanceMeters,
    restaurantAddress,
  };
}

async function createUnpaidOrder(
  checkout: ValidatedCheckout,
  req?: express.Request,
): Promise<CreatedOrderResult> {
  const db = requireAdminDb();
  const orderRef = db.collection(ORDERS_COLLECTION).doc();
  const now = Timestamp.now();

  await orderRef.set(stripUndefined({
    customer_info: {
      name: checkout.customerInfo.name,
      phone: checkout.customerInfo.phone,
      email: checkout.customerInfo.email,
      address:
        checkout.orderType === 'delivery'
          ? checkout.customerInfo.address || ''
          : undefined,
    },
    items: checkout.items,
    total_amount: checkout.subtotal,
    delivery_fee: checkout.deliveryFee,
    order_type: checkout.orderType,
    status: 'pending',
    payment_status: 'unpaid',
    delivery_distance_meters: checkout.deliveryDistanceMeters,
    created_at: now,
    updated_at: now,
  }));

  // Fire-and-forget: don't block order creation on email delivery
  const emailOrderData = {
    orderId: orderRef.id,
    customerName: checkout.customerInfo.name,
    customerPhone: checkout.customerInfo.phone,
    customerEmail: checkout.customerInfo.email,
    customerAddress:
      checkout.orderType === 'delivery'
        ? checkout.customerInfo.address || ''
        : '',
    orderType: checkout.orderType,
    items: checkout.items,
    subtotal: checkout.subtotal,
    deliveryFee: checkout.deliveryFee,
    total: checkout.total,
    deliveryDistanceMeters: checkout.deliveryDistanceMeters,
  };

  Promise.all([
    sendOrderNotificationEmail(emailOrderData, req),
    fetchSiteSettings().then((settings) =>
      sendOrderConfirmationEmail(
        {
          orderId: orderRef.id,
          customerName: checkout.customerInfo.name,
          customerEmail: checkout.customerInfo.email,
          orderType: checkout.orderType,
          items: checkout.items,
          subtotal: checkout.subtotal,
          deliveryFee: checkout.deliveryFee,
          total: checkout.total,
        },
        settings,
      ),
    ),
  ]).catch((error) => {
    console.error('Failed to send order emails:', error.message);
  });

  return { orderId: orderRef.id };
}

async function createStripeCheckoutSession(params: {
  handle: string;
  req: express.Request;
  checkout: ValidatedCheckout;
}) {
  const { handle, req, checkout } = params;
  const stripe = getStripeInstance();
  const baseUrl = getPublicAppBaseUrl(req);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = checkout.items.map((item) => {
    let images: string[] | undefined = undefined;
    if (item.image_url) {
      let absoluteUrl = item.image_url.trim();
      if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) {
        absoluteUrl = `${baseUrl.replace(/\/+$/, '')}/${absoluteUrl.replace(/^\/+/, '')}`;
      }
      if (absoluteUrl.startsWith('http') && !absoluteUrl.includes('localhost') && !absoluteUrl.includes('127.0.0.1')) {
        images = [absoluteUrl];
      }
    }

    return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.variation_label || undefined,
          images,
        },
        unit_amount: toCents(item.price),
      },
      quantity: item.quantity,
    };
  });

  // Add delivery fee as a separate line item if applicable
  if (checkout.deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Delivery Fee',
        },
        unit_amount: toCents(checkout.deliveryFee),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: checkout.customerInfo.email || undefined,
    metadata: {
      checkout_handle: handle,
      customer_name: checkout.customerInfo.name,
      customer_phone: checkout.customerInfo.phone,
      order_type: checkout.orderType,
    },
    success_url: `${baseUrl}/cart?session_id={CHECKOUT_SESSION_ID}&stripe=success`,
    cancel_url: `${baseUrl}/cart?stripe=cancelled`,
  });

  if (!session.id || !session.url) {
    throw new Error('Stripe did not return a checkout session.');
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

let emailTransporter: nodemailer.Transporter | null = null;

function initEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('   Email notifications disabled (SMTP_HOST/USER/PASS not set in .env)');
    return;
  }

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  emailTransporter
    .verify()
    .then(() => {
      console.log('   Email notifications enabled');
      logEmailDebug('Email notifications enabled (transporter verified successfully)');
    })
    .catch((err) => {
      console.error('   Email transporter verification failed:', err.message);
      logEmailDebug(`Email transporter verification failed: ${err.message}`);
      emailTransporter = null;
    });
}

async function sendOrderNotificationEmail(
  order: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress?: string;
    orderType: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    deliveryDistanceMeters?: number;
  },
  req?: express.Request,
) {
  if (!emailTransporter) {
    return;
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (!notificationEmail) {
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;">${item.quantity}x</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#e8e0d4;">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;text-align:right;">€ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

  const adminUrl = getAdminDashboardUrl(req);

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;">
      <div style="background:#c23b22;padding:20px 24px;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;">SUMI <span style="font-weight:300;">ADMIN</span></h1>
        <p style="margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.7;">New Order Received</p>
      </div>

      <div style="padding:24px;">
        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #333;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;">Order #${order.orderId.slice(-8).toUpperCase()}</p>
          <p style="margin:0 0 4px;font-size:18px;color:#e8e0d4;">${order.customerName}</p>
          <p style="margin:0;font-size:13px;color:#888;">
            ${order.customerPhone ? `Phone ${order.customerPhone}` : ''}
            ${order.customerEmail ? ` · Email ${order.customerEmail}` : ''}
          </p>
          ${order.customerAddress ? `<p style="margin:8px 0 0;font-size:13px;color:#888;">Address ${order.customerAddress}</p>` : ''}
          <p style="margin:8px 0 0;">
            <span style="display:inline-block;padding:3px 10px;font-size:10px;letter-spacing:1px;text-transform:uppercase;border:1px solid ${order.orderType === 'delivery' ? '#60a5fa' : '#34d399'};color:${order.orderType === 'delivery' ? '#60a5fa' : '#34d399'};">
              ${order.orderType}
            </span>
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr>
              <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;border-bottom:1px solid #444;">Qty</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;border-bottom:1px solid #444;">Item</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;border-bottom:1px solid #444;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width:100%;border-top:2px solid #444;padding-top:12px;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#888;">Subtotal</td>
            <td style="padding:4px 0;font-size:13px;color:#ccc;text-align:right;">€ ${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#888;">Delivery</td>
            <td style="padding:4px 0;font-size:13px;color:#ccc;text-align:right;">${order.deliveryFee > 0 ? `€ ${order.deliveryFee.toFixed(2)}` : 'Free'}</td>
          </tr>
          ${typeof order.deliveryDistanceMeters === 'number' ? `<tr><td style="padding:4px 0;font-size:13px;color:#888;">Distance</td><td style="padding:4px 0;font-size:13px;color:#ccc;text-align:right;">${(order.deliveryDistanceMeters / 1000).toFixed(2)} km</td></tr>` : ''}
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid #444;font-size:16px;font-weight:bold;color:#e8e0d4;">Total</td>
            <td style="padding:12px 0 0;border-top:1px solid #444;font-size:18px;font-weight:bold;color:#c23b22;text-align:right;">€ ${order.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="padding:16px 24px;background:#111;text-align:center;">
        <p style="margin:0;font-size:11px;color:#555;">
          Open the <a href="${adminUrl}" style="color:#c23b22;text-decoration:none;">Admin Dashboard</a> to manage this order.
        </p>
      </div>
    </div>
  `;

  await emailTransporter.sendMail({
    from: `"Sumi Sushi and Poke" <${process.env.SMTP_USER}>`,
    to: notificationEmail,
    subject: `New order #${order.orderId.slice(-8).toUpperCase()} - € ${order.total.toFixed(2)} (${order.orderType})`,
    html,
  });
}

async function sendOrderConfirmationEmail(
  order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    orderType: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
  },
  settings?: any,
) {
  if (!emailTransporter || !order.customerEmail) return;

  const restaurantName = settings?.restaurantName || 'Sumi Sushi and Poke';
  const contactPhone = settings?.contactPhone || '044 2479393';

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #333;color:#ccc;">${item.quantity}x</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#e8e0d4;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #333;color:#ccc;text-align:right;">€ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;padding:0;border:1px solid #333;">
      <div style="background:#c23b22;padding:24px 24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;text-transform:uppercase;">${restaurantName}</h1>
        <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.8;">Order Receipt</p>
      </div>

      <div style="padding:40px 32px;">
        <p style="font-size:18px;margin-bottom:24px;">Hello ${order.customerName},</p>
        <p style="line-height:1.6;color:#ccc;margin-bottom:32px;">
          Thank you for your order! We have received it and will start preparing it soon.
        </p>

        <div style="background:#111;padding:24px;border-radius:4px;margin-bottom:32px;">
          <p style="margin:0 0 16px;font-size:14px;"><span style="color:#888;">Order #:</span> ${order.orderId.slice(-8).toUpperCase()}</p>
          <p style="margin:0 0 16px;font-size:14px;"><span style="color:#888;">Type:</span> ${order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
          
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#888;">Subtotal</td>
              <td style="padding:4px 0;font-size:13px;color:#ccc;text-align:right;">€ ${order.subtotal.toFixed(2)}</td>
            </tr>
            ${order.deliveryFee > 0 ? `
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#888;">Delivery</td>
              <td style="padding:4px 0;font-size:13px;color:#ccc;text-align:right;">€ ${order.deliveryFee.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 0;border-top:1px solid #444;font-size:16px;font-weight:bold;color:#e8e0d4;">Total</td>
              <td style="padding:12px 0 0;border-top:1px solid #444;font-size:20px;font-weight:bold;color:#c23b22;text-align:right;">€ ${order.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:13px;color:#888;line-height:1.6;text-align:center;">
          If you have any questions about your order, please call us at ${contactPhone}.
        </p>
      </div>
    </div>
  `;

  await emailTransporter.sendMail({
    from: `"${restaurantName}" <${process.env.SMTP_USER}>`,
    to: order.customerEmail,
    subject: `Order Receipt - ${restaurantName} (#${order.orderId.slice(-8).toUpperCase()})`,
    html,
  });
}

async function sendOrderCancellationEmail(
  order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
  },
  settings?: any,
) {
  if (!emailTransporter || !order.customerEmail) return;

  const restaurantName = settings?.restaurantName || 'Sumi Sushi and Poke';
  const contactPhone = settings?.contactPhone || '044 2479393';

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;padding:0;border:1px solid #333;">
      <div style="background:#c23b22;padding:24px 24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;text-transform:uppercase;">${restaurantName}</h1>
        <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.8;">Order Cancelled</p>
      </div>

      <div style="padding:40px 32px;">
        <p style="font-size:18px;margin-bottom:24px;">Hello ${order.customerName},</p>
        <p style="line-height:1.6;color:#ccc;margin-bottom:32px;">
          We regret to inform you that your order #${order.orderId.slice(-8).toUpperCase()} has been cancelled.
        </p>
        <p style="font-size:13px;color:#888;line-height:1.6;">
          If a payment was made, it will be refunded automatically. If you have any questions or believe this was a mistake, please call us at ${contactPhone}.
        </p>
      </div>
    </div>
  `;

  await emailTransporter.sendMail({
    from: `"${restaurantName}" <${process.env.SMTP_USER}>`,
    to: order.customerEmail,
    subject: `Order Cancelled - ${restaurantName} (#${order.orderId.slice(-8).toUpperCase()})`,
    html,
  });
}

async function sendOrderReadyEmail(
  order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    orderType: string;
    customerAddress?: string;
  },
  settings?: any,
) {
  logEmailDebug(`sendOrderReadyEmail called for Order #${order.orderId}. Customer Email: ${order.customerEmail}. Transporter state: ${emailTransporter ? 'available' : 'null'}`);

  if (!emailTransporter || !order.customerEmail) {
    logEmailDebug(`sendOrderReadyEmail aborted: transporter is ${emailTransporter ? 'available' : 'null'}, customerEmail is ${order.customerEmail || 'missing'}`);
    return;
  }

  const restaurantName = settings?.restaurantName || 'Sumi Sushi and Poke';
  const contactPhone = settings?.contactPhone || '044 2479393';
  const address = settings?.address || 'Kuskinkatu 3, 20780 Kaarina';
  const orderIdAbbr = order.orderId.slice(-8).toUpperCase();

  const isDelivery = order.orderType === 'delivery';
  const statusLabel = isDelivery ? 'Out for Delivery' : 'Ready for Pickup';
  const subject = isDelivery 
    ? `Your order is on the way! - ${restaurantName} (#${orderIdAbbr})`
    : `Your order is ready for pickup! - ${restaurantName} (#${orderIdAbbr})`;

  const body = isDelivery
    ? `Great news! Your order #${orderIdAbbr} is on its way. Our courier has picked it up and is heading to your address:<br/><br/><strong style="color:#e8e0d4;">${escapeHtml(order.customerAddress || '')}</strong>.`
    : `Great news! Your order #${orderIdAbbr} is ready for pickup. Come grab it while it's fresh and hot! You can collect it at:<br/><br/><strong style="color:#e8e0d4;">${escapeHtml(address.replace(/\n/g, ', '))}</strong>.`;

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;padding:0;border:1px solid #333;">
      <div style="background:#c23b22;padding:24px 24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;text-transform:uppercase;">${restaurantName}</h1>
        <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.8;">${statusLabel}</p>
      </div>

      <div style="padding:40px 32px;">
        <p style="font-size:18px;margin-bottom:24px;">Hello ${order.customerName},</p>
        <p style="line-height:1.6;color:#ccc;margin-bottom:32px;">
          ${body}
        </p>
        <p style="font-size:13px;color:#888;line-height:1.6;text-align:center;border-top:1px solid #333;padding-top:20px;margin-bottom:0;">
          If you have any questions or need to reach us, please call ${contactPhone}.
        </p>
      </div>
    </div>
  `;

  logEmailDebug(`Attempting to send mail to: ${order.customerEmail}`);
  try {
    const info = await emailTransporter.sendMail({
      from: `"${restaurantName}" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject,
      html,
    });
    logEmailDebug(`✅ Email sent successfully to ${order.customerEmail}. Message ID: ${info.messageId}`);
  } catch (err: any) {
    logEmailDebug(`❌ Error sending mail to ${order.customerEmail}: ${err.message}`);
    throw err;
  }
}

function buildReservationStatusLabel(status?: ReservationStatus): string {
  if (!status) {
    return 'Pending';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildReservationDetailsHtml(reservation: ReservationEmailInput): string {
  return `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#888;"><strong>Date:</strong> <span style="color:#e8e0d4;">${reservation.date}</span></p>
      <p style="margin:0 0 8px;font-size:14px;color:#888;"><strong>Time:</strong> <span style="color:#e8e0d4;">${reservation.time}</span></p>
      <p style="margin:0 0 8px;font-size:14px;color:#888;"><strong>Guests:</strong> <span style="color:#e8e0d4;">${reservation.guests}</span></p>
      ${reservation.status ? `<p style="margin:0 0 8px;font-size:14px;color:#888;"><strong>Status:</strong> <span style="color:#e8e0d4;">${buildReservationStatusLabel(reservation.status)}</span></p>` : ''}
      ${reservation.specialRequests ? `<p style="margin:0 0 8px;font-size:14px;color:#888;"><strong>Requests:</strong> <br/><span style="color:#e8e0d4;">${reservation.specialRequests}</span></p>` : ''}
    </div>
  `;
}

async function sendReservationNotificationEmail(
  reservation: ReservationEmailInput,
  req?: express.Request,
  options?: {
    title?: string;
    subject?: string;
    footerMessage?: string;
  },
) {
  if (!emailTransporter) {
    return;
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (!notificationEmail) {
    return;
  }

  const adminUrl = getAdminDashboardUrl(req);
  const title = options?.title || 'New Reservation Request';
  const subject =
    options?.subject ||
    `New Reservation: ${reservation.date} at ${reservation.time} for ${reservation.guests} guests`;
  const footerMessage = options?.footerMessage || 'Open the Admin Dashboard to manage this reservation.';

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;">
      <div style="background:#c23b22;padding:20px 24px;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;">SUMI <span style="font-weight:300;">ADMIN</span></h1>
        <p style="margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.7;">${title}</p>
      </div>

      <div style="padding:24px;">
        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #333;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;">Ref #${reservation.id.slice(-8).toUpperCase()}</p>
          <p style="margin:0 0 4px;font-size:18px;color:#e8e0d4;">${reservation.customerName}</p>
          <p style="margin:0;font-size:13px;color:#888;">
            ${reservation.customerPhone ? `Phone ${reservation.customerPhone}` : ''}
            ${reservation.customerEmail ? ` · Email ${reservation.customerEmail}` : ''}
          </p>
        </div>

        ${buildReservationDetailsHtml(reservation)}
      </div>

      <div style="padding:16px 24px;background:#111;text-align:center;">
        <p style="margin:0;font-size:11px;color:#555;">
          ${footerMessage}
          <a href="${adminUrl}" style="color:#c23b22;text-decoration:none;">Admin Dashboard</a>.
        </p>
      </div>
    </div>
  `;

  await emailTransporter.sendMail({
    from: `"Sumi Sushi and Poke" <${process.env.SMTP_USER}>`,
    to: notificationEmail,
    subject,
    html,
  });
}

async function sendReservationConfirmationEmail(
  reservation: ReservationEmailInput,
  settings?: any,
  options?: {
    subject?: string;
    title?: string;
    body?: string;
    helperText?: string;
    manageUrl?: string;
    ctaLabel?: string;
  },
) {
  if (!emailTransporter) return;

  const restaurantName = settings?.restaurantName || 'Sumi Sushi and Poke';
  const contactPhone = settings?.contactPhone || '044 2479393';
  const address = settings?.address || 'Kuskinkatu 3, 20780 Kaarina';
  const title = options?.title || 'Reservation Received';
  const subject =
    options?.subject || `Reservation Request Received - ${restaurantName} (${reservation.date})`;
  const body =
    options?.body ||
    `Thank you for choosing ${restaurantName}. We have received your reservation request and are currently processing it. You will receive a final confirmation shortly once our staff has verified the table availability.`;
  const helperText =
    options?.helperText ||
    `You can update or cancel this reservation using the manage button below. If the reservation is close, please call us at ${contactPhone}.`;

  const html = `
    <div style="max-width:500px;margin:0 auto;background:#1a1a1a;color:#e8e0d4;font-family:Georgia,serif;padding:0;border:1px solid #333;">
      <div style="background:#c23b22;padding:24px 24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;letter-spacing:3px;color:#e8e0d4;text-transform:uppercase;">${restaurantName}</h1>
        <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e8e0d4;opacity:0.8;">${title}</p>
      </div>

      <div style="padding:40px 32px;">
        <p style="font-size:18px;margin-bottom:24px;">Hello ${reservation.customerName},</p>
        <p style="line-height:1.6;color:#ccc;margin-bottom:32px;">
          ${body}
        </p>
        <div style="background:#111;padding:24px;border-radius:4px;margin-bottom:32px;">
          <h3 style="margin:0 0 16px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#c23b22;">Your Request Details</h3>
          <p style="margin:0 0 8px;font-size:14px;"><span style="color:#888;">Reference:</span> ${reservation.id.slice(-8).toUpperCase()}</p>
          <p style="margin:0 0 8px;font-size:14px;"><span style="color:#888;">Date:</span> ${reservation.date}</p>
          <p style="margin:0 0 8px;font-size:14px;"><span style="color:#888;">Time:</span> ${reservation.time}</p>
          <p style="margin:0 0 8px;font-size:14px;"><span style="color:#888;">Guests:</span> ${reservation.guests}</p>
          ${reservation.status ? `<p style="margin:0 0 8px;font-size:14px;"><span style="color:#888;">Status:</span> ${buildReservationStatusLabel(reservation.status)}</p>` : ''}
          ${reservation.specialRequests ? `<p style="margin:16px 0 0;font-size:13px;color:#888;font-style:italic;">"${reservation.specialRequests}"</p>` : ''}
        </div>

        <p style="font-size:13px;color:#888;line-height:1.6;">
          ${helperText}
        </p>
        ${options?.manageUrl ? `<div style="margin-top:24px;"><a href="${options.manageUrl}" style="display:inline-block;padding:12px 18px;background:#c23b22;color:#fff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px;">${options.ctaLabel || 'Manage Reservation'}</a></div>` : ''}
      </div>

      <div style="background:#111;padding:24px;text-align:center;border-top:1px solid #333;">
        <p style="margin:0;font-size:11px;color:#444;letter-spacing:1px;text-transform:uppercase;">
          ${address}
        </p>
      </div>
    </div>
  `;

  await emailTransporter.sendMail({
    from: `"${restaurantName}" <${process.env.SMTP_USER}>`,
    to: reservation.customerEmail,
    subject,
    html,
  });
}

async function syncCheckoutFromStripe(
  handle: string,
  stripeSessionId?: string,
  req?: express.Request,
): Promise<CheckoutSyncResult> {
  const db = requireAdminDb();
  const pendingRef = db.collection(PENDING_CHECKOUTS_COLLECTION).doc(handle);
  const pendingSnapshot = await pendingRef.get();

  if (!pendingSnapshot.exists) {
    return { outcome: 'missing_checkout' };
  }

  const pendingCheckout = pendingSnapshot.data() as PendingCheckoutRecord;
  if (pendingCheckout.final_order_id) {
    return {
      outcome: 'paid',
      orderId: pendingCheckout.final_order_id,
      paymentState: pendingCheckout.stripe_payment_status,
    };
  }

  // Retrieve the Stripe session to check its payment status
  const sessionId = stripeSessionId || pendingCheckout.stripe_session_id;
  if (!sessionId) {
    return { outcome: 'missing_payment', paymentState: 'no_session' };
  }

  const stripe = getStripeInstance();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentState = session.payment_status || 'unknown';
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  if (!STRIPE_PAYMENT_SUCCESS_STATUSES.has(paymentState)) {
    const nextStatus: PendingCheckoutStatus =
      session.status === 'expired' ? 'cancelled' : 'payment_pending';

    await pendingRef.set(
      stripUndefined({
        status: nextStatus,
        payment_status: 'unpaid',
        stripe_payment_status: paymentState,
        stripe_payment_intent_id: paymentIntentId || undefined,
        updated_at: Timestamp.now(),
      }),
      { merge: true },
    );

    if (session.status === 'expired') {
      return { outcome: 'cancelled', paymentState };
    }

    return { outcome: 'pending', paymentState };
  }

  let createdOrderId: string | undefined;
  let createdOrderPayload: PendingCheckoutRecord | undefined;

  await db.runTransaction(async (transaction) => {
    const latestSnapshot = await transaction.get(pendingRef);
    if (!latestSnapshot.exists) {
      return;
    }

    const latestCheckout = latestSnapshot.data() as PendingCheckoutRecord;
    if (latestCheckout.final_order_id) {
      createdOrderId = latestCheckout.final_order_id;
      return;
    }

    const orderRef = db.collection(ORDERS_COLLECTION).doc();
    createdOrderId = orderRef.id;
    createdOrderPayload = latestCheckout;

    transaction.set(orderRef, stripUndefined({
      customer_info: {
        name: latestCheckout.customer_info.name,
        phone: latestCheckout.customer_info.phone,
        email: latestCheckout.customer_info.email,
        address:
          latestCheckout.order_type === 'delivery'
            ? latestCheckout.customer_info.address || ''
            : undefined,
      },
      items: latestCheckout.items,
      total_amount: latestCheckout.subtotal_amount,
      delivery_fee: latestCheckout.delivery_fee,
      order_type: latestCheckout.order_type,
      status: 'pending',
      payment_status: 'paid',
      payment_provider: 'stripe',
      payment_reference: paymentIntentId || handle,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId || undefined,
      delivery_distance_meters: latestCheckout.delivery_distance_meters,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }));

    transaction.set(
      pendingRef,
      stripUndefined({
        status: 'paid',
        payment_status: 'paid',
        stripe_payment_status: paymentState,
        stripe_payment_intent_id: paymentIntentId || undefined,
        payment_reference: paymentIntentId || handle,
        final_order_id: orderRef.id,
        updated_at: Timestamp.now(),
      }),
      { merge: true },
    );
  });

  if (!createdOrderId) {
    return { outcome: 'missing_payment', paymentState };
  }

  if (createdOrderPayload) {
    // Fire-and-forget: don't block webhook response on email delivery
    const emailPayload = {
      orderId: createdOrderId,
      customerName: createdOrderPayload.customer_info.name,
      customerPhone: createdOrderPayload.customer_info.phone,
      customerEmail: createdOrderPayload.customer_info.email,
      customerAddress:
        createdOrderPayload.order_type === 'delivery'
          ? createdOrderPayload.customer_info.address || ''
          : '',
      orderType: createdOrderPayload.order_type,
      items: createdOrderPayload.items,
      subtotal: createdOrderPayload.subtotal_amount,
      deliveryFee: createdOrderPayload.delivery_fee,
      total: createdOrderPayload.total_amount,
      deliveryDistanceMeters: createdOrderPayload.delivery_distance_meters,
    };

    Promise.all([
      sendOrderNotificationEmail(emailPayload, req),
      fetchSiteSettings().then((settings) =>
        sendOrderConfirmationEmail(
          {
            orderId: createdOrderId,
            customerName: createdOrderPayload.customer_info.name,
            customerEmail: createdOrderPayload.customer_info.email,
            orderType: createdOrderPayload.order_type,
            items: createdOrderPayload.items,
            subtotal: createdOrderPayload.subtotal_amount,
            deliveryFee: createdOrderPayload.delivery_fee,
            total: createdOrderPayload.total_amount,
          },
          settings,
        ),
      ),
    ]).catch((error) => {
      console.error('Failed to send order emails:', error.message);
    });
  }

  return {
    outcome: 'paid',
    orderId: createdOrderId,
    paymentState,
  };
}

app.post('/api/stripe/session', checkoutLimiter, async (req, res) => {
  try {
    requireAdminDb();
    getStripeInstance();

    const checkout = await validateCheckoutPayload(req.body || {});
    const checkoutHandle = createCheckoutHandle();
    const db = requireAdminDb();
    const pendingRef = db.collection(PENDING_CHECKOUTS_COLLECTION).doc(checkoutHandle);
    const now = Timestamp.now();

    await pendingRef.set(stripUndefined({
      handle: checkoutHandle,
      status: 'creating_session',
      payment_provider: 'stripe',
      payment_status: 'unpaid',
      customer_info: checkout.customerInfo,
      items: checkout.items,
      subtotal_amount: checkout.subtotal,
      delivery_fee: checkout.deliveryFee,
      total_amount: checkout.total,
      order_type: checkout.orderType,
      delivery_distance_meters: checkout.deliveryDistanceMeters,
      created_at: now,
      updated_at: now,
    } satisfies PendingCheckoutRecord));

    const session = await createStripeCheckoutSession({
      handle: checkoutHandle,
      req,
      checkout,
    });

    await pendingRef.set(
      stripUndefined({
        status: 'payment_pending',
        stripe_session_id: session.sessionId,
        stripe_checkout_url: session.checkoutUrl,
        updated_at: Timestamp.now(),
      }),
      { merge: true },
    );

    res.json({
      checkoutUrl: session.checkoutUrl,
      checkoutId: checkoutHandle,
      sessionId: session.sessionId,
      amount: checkout.total,
      subtotal: checkout.subtotal,
      deliveryFee: checkout.deliveryFee,
      paymentProvider: 'stripe',
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error.message);
    res.status(500).json({
      error:
        error.message || 'We could not initialize secure payment. Please try again.',
    });
  }
});

app.post('/api/orders/manual', requireAdminAuth, checkoutLimiter, async (req, res) => {
  try {
    requireAdminDb();

    const checkout = await validateCheckoutPayload(req.body || {});
    const createdOrder = await createUnpaidOrder(checkout, req);

    res.json({
      orderId: createdOrder.orderId,
      amount: checkout.total,
      subtotal: checkout.subtotal,
      deliveryFee: checkout.deliveryFee,
      paymentProvider: null,
      paymentStatus: 'unpaid',
    });
  } catch (error: any) {
    console.error('Error creating manual order:', error.message);
    res.status(500).json({
      error: error.message || 'We could not place your order. Please try again.',
    });
  }
});

app.get('/api/stripe/verify', async (req, res) => {
  try {
    const sessionId = sanitizeString(req.query.session_id);
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing Stripe session ID.' });
    }

    // Look up the pending checkout by Stripe session ID
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const handle = (session.metadata?.checkout_handle || '').trim();

    if (!handle) {
      return res.status(400).json({ error: 'Could not find the associated order.' });
    }

    const result = await syncCheckoutFromStripe(handle, sessionId, req);
    res.json(result);
  } catch (error: any) {
    console.error('Error verifying Stripe checkout:', error.message);
    res.status(500).json({
      error: error.message || 'We could not verify the payment status.',
    });
  }
});

// Stripe webhook requires raw body for signature verification.
// We register this BEFORE the global JSON body parser (or use express.raw here).
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.warn('Stripe webhook secret is not configured. Ignoring webhook.');
    return res.status(400).json({ error: 'Webhook secret not configured.' });
  }

  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header.' });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeInstance();
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const handle = (session.metadata?.checkout_handle || '').trim();

      if (handle) {
        await syncCheckoutFromStripe(handle, session.id);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook processing error:', error.message);
    res.status(500).json({ error: error.message || 'Webhook processing failed.' });
  }
});

app.post('/api/validate-delivery-address', geocodingLimiter, async (req, res) => {
  try {
    // Nominatim (OpenStreetMap) is free and doesn't require an API key
    // No API key check needed anymore

    const customerAddress = sanitizeString(req.body?.customerAddress);
    const restaurantAddress = sanitizeString(req.body?.restaurantAddress);

    if (!customerAddress || !restaurantAddress) {
      return res.status(400).json({
        error: 'Both customerAddress and restaurantAddress are required.',
      });
    }

    console.log(`[Geocoding] validating: "${customerAddress}" against restaurant: "${restaurantAddress}"`);

    // FIRST CHECK: If addresses match (after normalization), distance is 0
    if (addressesMatch(customerAddress, restaurantAddress)) {
      console.log('[Geocoding] Addresses match - setting distance to 0 (free delivery)');
      return res.json({
        distanceMeters: 0,
        withinFreeDeliveryRadius: true,
        freeDeliveryRadiusMeters: FREE_DELIVERY_RADIUS_METERS,
        matchedCustomerAddress: customerAddress,
        matchedRestaurantAddress: restaurantAddress,
        isFallback: false
      });
    }

    const [customerLocation, restaurantLocation] = await Promise.all([
      geocodeFinnishAddress(customerAddress),
      geocodeFinnishAddress(restaurantAddress),
    ]);

    if (!customerLocation || !restaurantLocation) {
      return res.status(400).json({
        error: 'We could not verify your delivery address. Please check the spelling or add a city/postal code.'
      });
    }

    const distanceMeters = getDistanceMeters(
      customerLocation.coordinates,
      restaurantLocation.coordinates,
    );

    res.json({
      distanceMeters,
      withinFreeDeliveryRadius: distanceMeters <= FREE_DELIVERY_RADIUS_METERS,
      freeDeliveryRadiusMeters: FREE_DELIVERY_RADIUS_METERS,
      matchedCustomerAddress: customerLocation.label,
      matchedRestaurantAddress: restaurantLocation.label,
      isFallback: false
    });
  } catch (error: any) {
    console.error('Error in validation endpoint:', error.message);
    res.status(400).json({
      error: error.message || 'We could not verify your delivery address. Please check the spelling or add a city/postal code.'
    });
  }
});

// Reservations endpoint Limit to 5 per 15 minutes per IP to prevent spam
const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reservation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/reservations', reservationLimiter, async (req, res) => {
  try {
    const db = requireAdminDb();
    const payload = req.body || {};

    const name = sanitizeString(payload.name);
    const email = sanitizeString(payload.email);
    const phone = sanitizeString(payload.phone);
    const date = sanitizeString(payload.date);
    const time = sanitizeString(payload.time);
    const guests = parseInt(payload.guests, 10);
    const specialRequests = sanitizeString(payload.specialRequests, 1000); // Allow longer string for requests

    if (!name || !email || !phone || !date || !time || isNaN(guests) || guests < 1) {
      return res.status(400).json({ error: 'Please provide all required fields correctly.' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    const scheduleError = validateReservationSchedule(date, time);
    if (scheduleError) {
      return res.status(400).json({ error: scheduleError });
    }

    const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc();
    const reservationId = reservationRef.id;
    const manageToken = createReservationManageToken();
    const manageUrl = getReservationManageUrl(reservationId, manageToken, req);
    const now = Timestamp.now();

    const reservationData: ReservationRecord = {
      customer_info: {
        name,
        email,
        phone,
      },
      date,
      time,
      guests,
      special_requests: specialRequests,
      status: 'pending', // pending, confirmed, cancelled
      manage_token_hash: hashReservationManageToken(manageToken),
      customer_edit_count: 0,
      created_at: now,
      updated_at: now,
    };

    await reservationRef.set(reservationData);

    const settings = await getSiteSettings();
    const reservationEmailData: ReservationEmailInput = {
      id: reservationId,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      date,
      time,
      guests,
      specialRequests,
      status: 'pending',
    };

    // Send emails in background
    sendReservationNotificationEmail(
      reservationEmailData,
      req,
      {
        footerMessage: 'Open the ',
      },
    ).catch((err) => console.error('Failed to send reservation notification email:', err.message));

    sendReservationConfirmationEmail(
      reservationEmailData,
      settings,
      {
        manageUrl,
      },
    ).catch((err) => console.error('Failed to send reservation confirmation email:', err.message));

    res.json({ success: true, id: reservationId, manageUrl });
  } catch (error: any) {
    console.error('Error creating reservation:', error.message);
    res.status(500).json({ error: 'We could not submit your reservation. Please try again or call us.' });
  }
});

app.get('/api/reservations/:reservationId/manage', async (req, res) => {
  try {
    const managedReservation = await getManagedReservation(
      req.params.reservationId,
      req.query.token,
    );
    const settings = await getSiteSettings();

    res.json(
      serializeManagedReservation(
        managedReservation.reservationId,
        managedReservation.reservation,
        settings,
      ),
    );
  } catch (error: any) {
    const status = error?.status || 500;
    if (status >= 500) {
      console.error('Error loading managed reservation:', error.message);
    }
    res.status(status).json({
      error: error.message || 'We could not load that reservation.',
    });
  }
});

app.patch('/api/reservations/:reservationId/manage', async (req, res) => {
  try {
    const managedReservation = await getManagedReservation(
      req.params.reservationId,
      req.body?.token,
    );
    const payload = req.body || {};
    const nextDate = sanitizeString(payload.date);
    const nextTime = sanitizeString(payload.time);
    const nextGuests = parseInt(payload.guests, 10);
    const nextSpecialRequests = sanitizeString(payload.specialRequests, 1000);

    if (!nextDate || !nextTime || Number.isNaN(nextGuests) || nextGuests < 1) {
      return res.status(400).json({ error: 'Please provide all required fields correctly.' });
    }

    const currentState = getReservationSelfServiceState(managedReservation.reservation);
    if (!currentState.canEdit) {
      return res.status(409).json({
        error: currentState.reason || 'This reservation can no longer be edited online.',
      });
    }

    const scheduleError = validateReservationSchedule(nextDate, nextTime);
    if (scheduleError) {
      return res.status(400).json({ error: scheduleError });
    }

    if (getReservationMinutesUntil(nextDate, nextTime) <= RESERVATION_EDIT_CUTOFF_MINUTES) {
      return res.status(400).json({
        error: `Online changes must be at least ${Math.floor(RESERVATION_EDIT_CUTOFF_MINUTES / 60)} hours in advance.`,
      });
    }

    const updatedStatus: ReservationStatus =
      managedReservation.reservation.status === 'confirmed' ? 'pending' : managedReservation.reservation.status;
    const now = Timestamp.now();

    await managedReservation.ref.set(
      {
        date: nextDate,
        time: nextTime,
        guests: nextGuests,
        special_requests: nextSpecialRequests,
        status: updatedStatus,
        customer_edit_count: (managedReservation.reservation.customer_edit_count || 0) + 1,
        last_customer_action_at: now,
        updated_at: now,
      },
      { merge: true },
    );

    const updatedReservation: ReservationRecord = {
      ...managedReservation.reservation,
      date: nextDate,
      time: nextTime,
      guests: nextGuests,
      special_requests: nextSpecialRequests,
      status: updatedStatus,
      customer_edit_count: (managedReservation.reservation.customer_edit_count || 0) + 1,
      last_customer_action_at: now,
      updated_at: now,
    };
    const settings = await getSiteSettings();
    const manageUrl = getReservationManageUrl(
      managedReservation.reservationId,
      sanitizeString(req.body?.token, 256),
      req,
    );
    const reservationEmailData: ReservationEmailInput = {
      id: managedReservation.reservationId,
      customerName: updatedReservation.customer_info.name,
      customerPhone: updatedReservation.customer_info.phone,
      customerEmail: updatedReservation.customer_info.email,
      date: updatedReservation.date,
      time: updatedReservation.time,
      guests: updatedReservation.guests,
      specialRequests: updatedReservation.special_requests,
      status: updatedReservation.status,
    };

    sendReservationNotificationEmail(
      reservationEmailData,
      req,
      {
        title: 'Reservation Updated By Guest',
        subject: `Reservation Updated: ${updatedReservation.date} at ${updatedReservation.time} for ${updatedReservation.guests} guests`,
        footerMessage: 'Review this change in the ',
      },
    ).catch((err) => console.error('Failed to send reservation update notification email:', err.message));

    sendReservationConfirmationEmail(
      reservationEmailData,
      settings,
      {
        subject: `Reservation Updated - ${settings?.restaurantName || 'Sumi Sushi and Poke'} (${updatedReservation.date})`,
        title: 'Reservation Updated',
        body:
          updatedStatus === 'pending'
            ? `We received your reservation changes and sent the updated request back to our team for review. We will confirm availability as soon as possible.`
            : `Your reservation details have been updated successfully.`,
        helperText:
          updatedStatus === 'pending'
            ? `Because the reservation was already confirmed, your update moved it back to pending review. You can still cancel it with the button below, or call us if you need immediate help.`
            : `You can keep using the manage button below if you need to adjust or cancel this reservation.`,
        manageUrl,
        ctaLabel: 'View Reservation',
      },
    ).catch((err) => console.error('Failed to send reservation update confirmation email:', err.message));

    res.json(
      serializeManagedReservation(managedReservation.reservationId, updatedReservation, settings),
    );
  } catch (error: any) {
    const status = error?.status || 500;
    if (status >= 500) {
      console.error('Error updating reservation:', error.message);
    }
    res.status(status).json({
      error: error.message || 'We could not update that reservation.',
    });
  }
});

app.post('/api/reservations/:reservationId/cancel', async (req, res) => {
  try {
    const managedReservation = await getManagedReservation(
      req.params.reservationId,
      req.body?.token,
    );
    const currentState = getReservationSelfServiceState(managedReservation.reservation);

    if (!currentState.canCancel) {
      return res.status(409).json({
        error: currentState.reason || 'This reservation can no longer be cancelled online.',
      });
    }

    const now = Timestamp.now();
    await managedReservation.ref.set(
      {
        status: 'cancelled',
        cancelled_at: now,
        cancelled_by: 'customer',
        last_customer_action_at: now,
        updated_at: now,
      },
      { merge: true },
    );

    const cancelledReservation: ReservationRecord = {
      ...managedReservation.reservation,
      status: 'cancelled',
      cancelled_at: now,
      cancelled_by: 'customer',
      last_customer_action_at: now,
      updated_at: now,
    };
    const settings = await getSiteSettings();
    const reservationEmailData: ReservationEmailInput = {
      id: managedReservation.reservationId,
      customerName: cancelledReservation.customer_info.name,
      customerPhone: cancelledReservation.customer_info.phone,
      customerEmail: cancelledReservation.customer_info.email,
      date: cancelledReservation.date,
      time: cancelledReservation.time,
      guests: cancelledReservation.guests,
      specialRequests: cancelledReservation.special_requests,
      status: cancelledReservation.status,
    };

    sendReservationNotificationEmail(
      reservationEmailData,
      req,
      {
        title: 'Reservation Cancelled By Guest',
        subject: `Reservation Cancelled: ${cancelledReservation.date} at ${cancelledReservation.time} for ${cancelledReservation.guests} guests`,
        footerMessage: 'Review this cancellation in the ',
      },
    ).catch((err) => console.error('Failed to send reservation cancellation notification email:', err.message));

    sendReservationConfirmationEmail(
      reservationEmailData,
      settings,
      {
        subject: `Reservation Cancelled - ${settings?.restaurantName || 'Sumi Sushi and Poke'} (${cancelledReservation.date})`,
        title: 'Reservation Cancelled',
        body: `Your reservation has been cancelled. If this was a mistake, please contact the restaurant and we will do our best to help.`,
        helperText: `No further action is needed. If you would like to book again, you can return to our reservations page anytime.`,
      },
    ).catch((err) => console.error('Failed to send reservation cancellation confirmation email:', err.message));

    res.json(
      serializeManagedReservation(managedReservation.reservationId, cancelledReservation, settings),
    );
  } catch (error: any) {
    const status = error?.status || 500;
    if (status >= 500) {
      console.error('Error cancelling reservation:', error.message);
    }
    res.status(status).json({
      error: error.message || 'We could not cancel that reservation.',
    });
  }
});

app.patch('/api/admin/orders/:orderId/status', requireAdminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ORDER_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const db = requireAdminDb();
    const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const snapshot = await orderRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = snapshot.data();
    await orderRef.update({
      status,
      updated_at: Timestamp.now(),
    });

    if (status === 'cancelled') {
      const settings = await fetchSiteSettings();
      await sendOrderCancellationEmail(
        {
          orderId,
          customerName: orderData?.customer_info?.name || 'Guest',
          customerEmail: orderData?.customer_info?.email,
        },
        settings,
      ).catch((err) => console.error('Failed to send order cancellation email:', err.message));
    }

    if (status === 'ready') {
      logEmailDebug(`PATCH status updated to 'ready' for order ${orderId}. Fetching settings...`);
      const settings = await fetchSiteSettings();
      await sendOrderReadyEmail(
        {
          orderId,
          customerName: orderData?.customer_info?.name || 'Guest',
          customerEmail: orderData?.customer_info?.email,
          orderType: orderData?.order_type || 'pickup',
          customerAddress: orderData?.customer_info?.address || '',
        },
        settings,
      ).then(() => {
        logEmailDebug(`Finished sendOrderReadyEmail execution for order ${orderId}`);
      }).catch((err) => {
        logEmailDebug(`Failed inside PATCH route handler for sendOrderReadyEmail: ${err.message}`);
        console.error('Failed to send order ready email:', err.message);
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating order status:', error.message);
    res.status(500).json({ error: error.message || 'Failed to update order status.' });
  }
});

app.patch('/api/admin/reservations/:reservationId/status', requireAdminAuth, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;

    if (!RESERVATION_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid reservation status.' });
    }

    const db = requireAdminDb();
    const resRef = db.collection(RESERVATIONS_COLLECTION).doc(reservationId);
    const snapshot = await resRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = snapshot.data() as ReservationRecord;
    await resRef.update({
      status,
      updated_at: Timestamp.now(),
    });

    const settings = await getSiteSettings();
    const reservationEmailData: ReservationEmailInput = {
      id: reservationId,
      customerName: reservation.customer_info.name,
      customerPhone: reservation.customer_info.phone,
      customerEmail: reservation.customer_info.email,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      specialRequests: reservation.special_requests,
      status: status,
    };

    if (status === 'confirmed') {
      const manageToken = ''; // We don't have the plain token here easily, but the email template handle it
      // Actually we might need the manage link. But if it's already confirmed, they might just need the info.
      // Let's see if we can get the manage URL.
      
      await sendReservationConfirmationEmail(
        reservationEmailData,
        settings,
        {
          subject: `Reservation Confirmed - ${settings?.restaurantName || 'Sumi Sushi and Poke'} (${reservation.date})`,
          title: 'Reservation Confirmed',
          body: `Good news! Your reservation at ${settings?.restaurantName || 'Sumi Sushi and Poke'} has been confirmed. We look forward to seeing you!`,
          helperText: `If you need to make changes, please call us at ${settings?.contactPhone || '044 2479393'}.`,
        },
      ).catch((err) => console.error('Failed to send reservation confirmation email:', err.message));
    } else if (status === 'cancelled') {
      await sendReservationConfirmationEmail(
        reservationEmailData,
        settings,
        {
          subject: `Reservation Declined - ${settings?.restaurantName || 'Sumi Sushi and Poke'} (${reservation.date})`,
          title: 'Reservation Declined',
          body: `We are sorry, but we are unable to accommodate your reservation request at this time. This is usually due to the restaurant being fully booked for the requested period.`,
          helperText: `We hope to see you another time! If you have questions, please call us at ${settings?.contactPhone || '044 2479393'}.`,
        },
      ).catch((err) => console.error('Failed to send reservation rejection email:', err.message));
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating reservation status:', error.message);
    res.status(500).json({ error: error.message || 'Failed to update reservation status.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && {
      checks: {
        firebaseAdminConfigured: isFirebaseAdminConfigured(),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        stripeWebhookConfigured: Boolean(
          process.env.STRIPE_WEBHOOK_SECRET?.trim(),
        ),
        smtpConfigured: Boolean(
          process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
        ),
      },
    }),
  });
});

// Serve static frontend files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve the React app for any other request (SPA routing)
app.get('*', (req, res, next) => {
  // If the request starts with /api, let it fall through or return 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// GLOBAL ERROR HANDLER - Must be last middleware
// Prevents leaking internal errors to clients
// ============================================================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]:', err.message);
  
  // Don't expose internal error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'An internal server error occurred. Please try again later.',
    ...(isDev && { stack: err.stack }),
  });
});


// ============================================================================
// STARTUP ENVIRONMENT VALIDATION
// Fail loudly at boot if critical config is missing.
// ============================================================================
const REQUIRED_ENV_VARS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
];

const OPTIONAL_ENV_WARNINGS = [
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe payments' },
  { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe webhook' },
  { key: 'SMTP_HOST', label: 'Email notifications' },
  { key: 'SMTP_USER', label: 'Email notifications' },
  { key: 'SMTP_PASS', label: 'Email notifications' },
];

const missingRequired = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
if (missingRequired.length > 0 && process.env.NODE_ENV === 'production') {
  console.error(`\n❌ FATAL: Missing required environment variables: ${missingRequired.join(', ')}`);
  console.error('   The server cannot start without Firebase Admin credentials in production.\n');
  process.exit(1);
} else if (missingRequired.length > 0) {
  console.warn(`\n⚠️  Missing env vars (non-fatal in dev): ${missingRequired.join(', ')}`);
}

for (const { key, label } of OPTIONAL_ENV_WARNINGS) {
  if (!process.env[key]?.trim()) {
    console.warn(`   ⚠️  ${key} not set — ${label} will be disabled.`);
  }
}

initEmailTransporter();

// Only start the server if we are not in a Vercel/serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\nSumi Sushi API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
