// Booking storage + helpers.
// There is no backend in this project, so bookings are kept in localStorage (like the user accounts).
// To use a real database later, replace the functions in this file with calls to your server API.

import { deleteMedia } from "./media.js";
import { sendMail } from "./mail.js";
import { formatTime } from "./pickup.js";

const KEY = "explore-malaysia-bookings";

export const HOLD_MINUTES = 30; // an unpaid booking is held for this long, then expires
export const MIN_DAYS_AHEAD = 3; // earliest travel date = today + 3 days
export const MAX_DAYS_AHEAD = 365; // latest travel date = today + 1 year
export const MAX_TRAVELLERS = 10;
export const TERMS_VERSION = "1.0";
export const SERVICE_TAX_RATE = 0.06; // 6% service tax (SST), added on top of the package price

const round2 = (n) => Math.round(n * 100) / 100;

/* ---------- discounts: group discount + promo codes ---------- */

// Group discount: more travellers, bigger discount (taken off the package price before tax).
export const GROUP_DISCOUNTS = [
  { min: 8, percent: 10 },
  { min: 5, percent: 5 },
];
export const groupDiscountPercent = (travellers) => GROUP_DISCOUNTS.find((g) => travellers >= g.min)?.percent || 0;

// Promo codes can be managed by the admin (Admin dashboard > Promo codes). Stored in localStorage.
const PROMO_KEY = "explore-malaysia-promos";
const DEFAULT_PROMOS = [
  { code: "WELCOME10", percent: 10, active: true, label: "10% off your trip" },
  { code: "MERDEKA50", amountOff: 50, active: true, label: "RM 50 off your trip" },
];
export const getPromos = () => {
  try {
    const value = JSON.parse(localStorage.getItem(PROMO_KEY));
    return Array.isArray(value) ? value : DEFAULT_PROMOS;
  } catch {
    return DEFAULT_PROMOS;
  }
};
export const savePromos = (list) => {
  try {
    localStorage.setItem(PROMO_KEY, JSON.stringify(list));
  } catch {
    /* storage not available - ignore */
  }
};
export const findPromo = (code = "") => {
  const clean = code.trim().toUpperCase();
  return clean ? getPromos().find((p) => p.active && p.code === clean) || null : null;
};

// Full price breakdown: price x travellers - group discount - promo = subtotal, then + 6% service tax = total.
export const priceBreakdown = (pricePerPerson, travellers, promoCode = "") => {
  const gross = round2(pricePerPerson * travellers);
  const groupPercent = groupDiscountPercent(travellers);
  const groupDiscount = round2((gross * groupPercent) / 100);
  const afterGroup = gross - groupDiscount;
  const promo = findPromo(promoCode);
  const promoDiscount = promo ? Math.min(afterGroup, promo.percent ? round2((afterGroup * promo.percent) / 100) : promo.amountOff) : 0;
  const subtotal = round2(afterGroup - promoDiscount);
  const tax = round2(subtotal * SERVICE_TAX_RATE);
  return { gross, groupPercent, groupDiscount, promoCode: promo?.code || "", promoDiscount, subtotal, tax, total: round2(subtotal + tax) };
};

// Works for old bookings too (made before tax / discounts existed).
export const bookingBreakdown = (b) => ({
  gross: b.gross ?? b.subtotal ?? b.total,
  groupDiscount: b.groupDiscount || 0,
  promoCode: b.promoCode || "",
  promoDiscount: b.promoDiscount || 0,
  subtotal: b.subtotal ?? b.total,
  tax: b.tax ?? 0,
  hasTax: b.tax !== undefined,
  total: b.total,
});

export const STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Confirmed & paid",
  cancelled: "Cancelled",
  expired: "Expired",
};

/* ---------- storage ---------- */

const readAll = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeAll = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage not available - ignore */
  }
};

// Unpaid bookings that ran out of time become "expired".
function loadAll() {
  const list = readAll();
  let changed = false;
  const next = list.map((b) => {
    if (b.status === "pending" && Date.now() > b.expiresAt) {
      changed = true;
      return { ...b, status: "expired" };
    }
    return b;
  });
  if (changed) writeAll(next);
  return next;
}

export const getBookingsFor = (email) =>
  loadAll()
    .filter((b) => b.userEmail === email)
    .sort((a, b) => b.createdAt - a.createdAt);

export const getAllBookings = () => loadAll().sort((a, b) => b.createdAt - a.createdAt);

export const getBooking = (id, email) => loadAll().find((b) => b.id === id && b.userEmail === email) || null;

function updateBooking(id, patch) {
  const list = loadAll();
  const next = list.map((b) => (b.id === id ? { ...b, ...patch } : b));
  writeAll(next);
  return next.find((b) => b.id === id) || null;
}

/* ---------- dates & money ---------- */

const pad = (n) => String(n).padStart(2, "0");

// Local date as YYYY-MM-DD (toISOString() would use UTC and be off by one day in Malaysia).
export const toLocalISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Last day of the trip, worked out from the package duration, e.g. "3 Days 2 Nights" starting 6 Nov ends 8 Nov.
export function tripEndDate(isoDate, duration) {
  const days = parseInt(/(\d+)\s*day/i.exec(duration || "")?.[1], 10);
  if (!isoDate || !days) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days - 1);
  return toLocalISO(d);
}

const addDays = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

export const minTravelDate = () => toLocalISO(addDays(MIN_DAYS_AHEAD));
export const maxTravelDate = () => toLocalISO(addDays(MAX_DAYS_AHEAD));

export function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${isoDate}T00:00:00`) - today) / 86400000);
}

export const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatRM = (n) => `RM ${Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Malaysian mobile number: 01x-xxxxxxx, 011-xxxxxxxx, +601x...
export const isMalaysianMobile = (value) => /^(\+?60|0)1[0-9]{8,9}$/.test(value.replace(/[\s-]/g, ""));

/* ---------- refunds (must match the Terms & Conditions) ---------- */

export function refundRule(booking) {
  const days = daysUntil(booking.travelDate);
  if (days >= 14) return { percent: 100, label: "14 or more days before departure" };
  if (days >= 7) return { percent: 50, label: "7 to 13 days before departure" };
  return { percent: 0, label: "less than 7 days before departure" };
}

export function refundAmount(booking) {
  if (booking.status !== "paid") return 0;
  return Math.round(booking.total * refundRule(booking).percent) / 100;
}

/* ---------- actions ---------- */

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
const randomCode = (length) => Array.from({ length }, () => REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]).join("");

export function createBooking({ userEmail, pkg, travelDate, travellers, pickup = null, contactName, contactPhone, notes, promoCode = "" }) {
  const now = Date.now();
  const price = priceBreakdown(pkg.price, travellers, promoCode);
  const booking = {
    id: `EM-${toLocalISO(new Date()).replace(/-/g, "").slice(2)}-${randomCode(5)}`,
    userEmail,
    packageId: pkg.id,
    destination: pkg.destination,
    category: pkg.category,
    duration: pkg.duration,
    pricePerPerson: pkg.price,
    travellers,
    gross: price.gross,
    groupDiscount: price.groupDiscount,
    promoCode: price.promoCode,
    promoDiscount: price.promoDiscount,
    subtotal: price.subtotal,
    serviceTaxRate: SERVICE_TAX_RATE,
    tax: price.tax,
    total: price.total,
    travelDate,
    endDate: tripEndDate(travelDate, pkg.duration),
    pickup, // { id, name, address, time } or null for old bookings
    contactName,
    contactPhone,
    notes,
    status: "pending",
    createdAt: now,
    expiresAt: now + HOLD_MINUTES * 60 * 1000,
    terms: { version: TERMS_VERSION, acceptedAt: new Date(now).toISOString() },
    payment: null,
  };
  writeAll([...loadAll(), booking]);
  return booking;
}

// method = "Credit card" | "Debit card" | "FPX online banking" | "Touch 'n Go eWallet"
// account = what is safe to show on the receipt, e.g. "Visa •••• 4242" or "Maybank2u"
export function markPaid(id, { reference, method, account }) {
  const updated = updateBooking(id, {
    status: "paid",
    payment: {
      method,
      reference,
      account,
      paidAt: Date.now(),
    },
  });
  if (updated) {
    sendMail(updated.userEmail, `Booking confirmed: ${updated.destination} (${updated.id})`,
      `Hi ${updated.contactName},\n\nThank you! Your payment of ${formatRM(updated.total)} was received and your trip is confirmed.\n\nBooking reference: ${updated.id}\nPackage: ${updated.destination} (${updated.duration})\nTravel dates: ${formatDate(updated.travelDate)} to ${formatDate(updated.endDate)}\nTravellers: ${updated.travellers}\n${updated.pickup ? `Pick-up: ${updated.pickup.name}, ${updated.pickup.address} at ${formatTime(updated.pickup.time)} on ${formatDate(updated.travelDate)}\n` : ""}Payment: ${method} (${account}), ref ${reference}\n\nYou can download your e-ticket (PDF with QR code) from the booking page.\n\nExplore Malaysia`);
  }
  return updated;
}

export function markExpired(id) {
  return updateBooking(id, { status: "expired" });
}

export function cancelBooking(id) {
  const booking = loadAll().find((b) => b.id === id);
  if (!booking) return null;
  // a cancelled trip no longer has a public review, so free the stored photos/videos
  booking.review?.media?.forEach((m) => deleteMedia(m.id));
  const cancelled = updateBooking(id, {
    status: "cancelled",
    review: null,
    cancelledAt: Date.now(),
    refund: booking.status === "paid" ? refundAmount(booking) : 0,
  });
  if (booking.status === "paid") {
    sendMail(booking.userEmail, `Booking cancelled: ${booking.destination} (${booking.id})`,
      `Hi ${booking.contactName},\n\nYour booking ${booking.id} was cancelled. ${cancelled.refund > 0 ? `A refund of ${formatRM(cancelled.refund)} will be returned to your original payment method within 7 to 14 working days.` : "This cancellation is not eligible for a refund."}\n\nExplore Malaysia`);
  }
  return cancelled;
}

/* ---------- ratings & reviews ---------- */

export const MAX_COMMENT = 500;
// true  = a traveller can only review after the trip has ended (recommended for a live site)
// false = a traveller can review as soon as the booking is paid (easier to test and demo)
export const REVIEW_ONLY_AFTER_TRIP = false;

export function reviewState(booking) {
  if (booking.status !== "paid") return { allowed: false, reason: "" };
  if (REVIEW_ONLY_AFTER_TRIP) {
    const end = booking.endDate || tripEndDate(booking.travelDate, booking.duration);
    if (daysUntil(end) >= 0) return { allowed: false, reason: `You can rate this trip after it ends on ${formatDate(end)}.` };
  }
  return { allowed: true, reason: "" };
}

export function saveReview(id, { rating, comment, media = [] }) {
  const existing = loadAll().find((b) => b.id === id);
  if (!existing) return null;
  const now = Date.now();
  return updateBooking(id, { review: { rating, comment, media, createdAt: existing.review?.createdAt || now, updatedAt: now } });
}

export const deleteReview = (id) => updateBooking(id, { review: null });

// "KHOR KHAI XUAN" -> "Khor K."  (only the first name and an initial are shown publicly)
const publicName = (full = "") => {
  const [first = "Traveller", ...rest] = full.trim().split(/\s+/);
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  return rest.length ? `${cap(first)} ${rest[rest.length - 1].charAt(0).toUpperCase()}.` : cap(first);
};

export function getReviewsForPackage(packageId) {
  return loadAll()
    .filter((b) => b.packageId === packageId && b.status === "paid" && b.review)
    .map((b) => ({ id: b.id, name: publicName(b.contactName), travelDate: b.travelDate, ...b.review }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getRatingSummary(packageId) {
  const reviews = getReviewsForPackage(packageId);
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  return { count, average };
}