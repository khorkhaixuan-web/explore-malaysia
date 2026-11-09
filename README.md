# Explore Malaysia – Travel Agency SPA (DIT2163N Assignment 1)

React 18 + Vite + React Router. Data comes from a mock API (`public/api/packages.json`, fetched at `/api/packages.json`).

## Run locally
    npm install
    npm run dev
    npm run build

## Deploy
Push to GitHub, then import the repo in Vercel (framework: Vite). `vercel.json` handles SPA routing.

## Booking, payment and Terms & Conditions
- `/book/:id` – choose travel date + travellers, accept the Terms & Conditions (login required)
- `/payment/:bookingId` – pay by card, FPX online banking or Touch 'n Go eWallet (30-minute hold on unpaid bookings). A 6% service tax is added to the package price
- `/bookings/:bookingId` – confirmation / receipt, print, cancel with refund rules
- `/my-bookings` – list of the user's bookings
- `/terms` – Terms & Conditions (text in `src/data/terms.js`)

Bookings are stored in localStorage (`src/bookings.js`). The payment is a DEMO (`src/payment.js`):
no real money moves. See the comments in that file for how to connect a real payment gateway.

## Ratings and reviews
Paid bookings can be rated (1-5 stars) with an optional comment on the booking page. Reviews are shown on the package page and as an average on the package card. Set `REVIEW_ONLY_AFTER_TRIP = true` in `src/bookings.js` to allow reviews only after the trip ends.

Reviews can include up to 5 photos/videos. Because there is no backend, the files are kept in the browser's IndexedDB (`src/media.js`).

## Service tax
`SERVICE_TAX_RATE` (6%) in `src/bookings.js` is added on top of the package price. Bookings store `subtotal`, `tax` and `total`; refunds are based on the total paid.

## Known limits of the demo (need a backend for a live site)
- Accounts, bookings and review media live in the visitor's browser only; passwords are salted + hashed in the browser, which is not secure enough for real users.
- Payments are simulated; use a payment gateway and confirm payment on a server before marking a booking as paid.

## Special features
- **Admin dashboard** (`/admin`): overview (revenue, 6% tax collected, discounts), all bookings (search, filter, cancel, export CSV), add/edit/hide packages, manage promo codes, ticket check-in. Demo admin login: `admin@exploremalaysia.com` / `admin123` (change `ADMIN_PASSWORD` in `src/context/AuthContext.jsx`).
- **Promo codes + group discount**: promo box on the booking page (try `WELCOME10`, `MERDEKA50`). 5+ travellers get 5% off, 8+ get 10% off. Discounts are taken off before the 6% service tax.
- **Suggested itinerary**: day-by-day plan on each package page, generated from the package duration and description (`src/itinerary.js`).
- **E-ticket PDF with QR code**: "Download e-ticket" on a paid booking (`src/ticket.js`). The admin Check-in tab verifies the reference / QR text.
- **Forgot password + e-mail**: `/forgot-password` sends a 6-digit code (15 minutes, 5 tries). E-mails are simulated and shown in the Inbox (`/inbox`) because there is no mail server (`src/mail.js`).
