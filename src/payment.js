// Payment service: credit/debit card, online banking (FPX) and Touch 'n Go eWallet.
//
// DEMO MODE: no real money moves. The pay...() functions only wait a moment and then report
// success (or a failure for the test card below), so the whole booking flow can be tested and presented.
//
// To accept REAL payments you need a merchant account with a Malaysian payment gateway
// (e.g. Billplz, iPay88, Razer Merchant Services, Stripe) and a small backend, because secret API keys
// must never be placed in React code. Real card numbers should be typed into the gateway's hosted
// fields, so they never touch your own server. Then replace the body of each pay...() function with a
// fetch("/api/payments/...") call and let your backend confirm the payment (webhook) before the
// booking is marked as paid.

export const PAYMENT_DEMO_MODE = true;

/* ---------- payment methods shown in the picker ---------- */

export const PAYMENT_METHODS = [
  { id: "card", label: "Credit / debit card", hint: "Visa, Mastercard or American Express", badge: "CARD" },
  { id: "fpx", label: "Online banking (FPX)", hint: "Pay through your own bank's website", badge: "FPX" },
  { id: "tng", label: "Touch 'n Go eWallet", hint: "Approve the payment in your TNG eWallet app", badge: "TNG" },
];

export const BANKS = [
  "Maybank2u",
  "CIMB Clicks",
  "Public Bank",
  "RHB Now",
  "Hong Leong Connect",
  "AmBank",
  "Bank Islam",
  "Bank Rakyat",
  "BSN",
  "Affin Bank",
  "Alliance Bank",
  "OCBC Bank",
  "UOB Bank",
  "HSBC Bank",
  "Standard Chartered",
];

/* ---------- card helpers (formatting + validation) ---------- */

export const onlyDigits = (value) => String(value).replace(/\D/g, "");

export function detectCardBrand(value) {
  const d = onlyDigits(value);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "American Express";
  return "";
}
 
export const cvvLength = (brand) => (brand === "American Express" ? 4 : 3);
const cardLength = (brand) => (brand === "American Express" ? 15 : 16);

// "4242424242424242" -> "4242 4242 4242 4242" (American Express uses 4-6-5)
export function formatCardNumber(value) {
  let d = onlyDigits(value);
  const amex = /^3[47]/.test(d);
  d = d.slice(0, amex ? 15 : 16);
  if (amex) return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(" ");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

// "1228" -> "12/28" (a first digit of 2-9 becomes 02-09)
export function formatExpiry(value) {
  let d = onlyDigits(value).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// Luhn checksum: catches mistyped card numbers.
export function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
}

// Returns an object with one message per invalid field ({} when the card is fine).
export function validateCard({ name, number, expiry, cvv }) {
  const errors = {};
  const brand = detectCardBrand(number);
  const digits = onlyDigits(number);

  if (!name.trim()) errors.name = "Enter the name on your card.";
  else if (!/^[A-Za-z][A-Za-z .'@/-]+$/.test(name.trim())) errors.name = "The name can only contain letters and spaces.";

  if (!digits) errors.number = "Enter your card number.";
  else if (digits.length !== cardLength(brand) || !luhnValid(digits)) errors.number = "Enter a valid card number.";

  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!expiry) errors.expiry = "Enter the expiry date.";
  else if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) errors.expiry = "Use the format MM/YY, e.g. 08/28.";
  else {
    const now = new Date();
    // a card is valid until the end of its expiry month
    if (2000 + Number(match[2]) < now.getFullYear() || (2000 + Number(match[2]) === now.getFullYear() && Number(match[1]) < now.getMonth() + 1)) {
      errors.expiry = "This card has expired.";
    }
  }

  if (!cvv) errors.cvv = "Enter the CVV.";
  else if (cvv.length !== cvvLength(brand)) errors.cvv = `The CVV has ${cvvLength(brand)} digits.`;

  return errors;
}

/* ---------- payment requests (DEMO) ---------- */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const refCode = (prefix) => `${prefix}${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 90 + 10)}`;

// Test cards: any valid number is approved, except one ending in 0002 which the "bank" declines.
// Use it to show the error message in your demo.
export async function payWithCard({ bookingId, amount, card }) {
  // eslint-disable-next-line no-unused-vars
  const _request = { bookingId, amount, card };
  await wait(2000); // "contacting the card issuer"
  if (onlyDigits(card.number).endsWith("0002")) {
    return { ok: false, error: "Your bank declined this card. Please try another card." };
  }
  const brand = detectCardBrand(card.number) || "Card";
  const last4 = onlyDigits(card.number).slice(-4);
  return { ok: true, reference: refCode("CRD"), account: `${brand} •••• ${last4}` };
}

export async function payWithBank({ bookingId, amount, bank }) {
  // eslint-disable-next-line no-unused-vars
  const _request = { bookingId, amount, bank };
  await wait(1800); // "bank confirms the transfer"
  return { ok: true, reference: refCode("FPX"), account: bank };
}

export async function payWithTng({ bookingId, amount, phone }) {
  // eslint-disable-next-line no-unused-vars
  const _request = { bookingId, amount, phone };
  await wait(2500); // "waiting for approval in the app"
  return { ok: true, reference: refCode("TNG"), account: `•••• ${onlyDigits(phone).slice(-4)}` };
}