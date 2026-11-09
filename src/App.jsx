import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Packages from "./pages/Packages.jsx";
const PackageDetails = lazy(() => import("./pages/PackageDetails.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
import NotFound from "./pages/NotFound.jsx";
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Booking = lazy(() => import("./pages/Booking.jsx"));
const Payment = lazy(() => import("./pages/Payment.jsx"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation.jsx"));
const MyBookings = lazy(() => import("./pages/MyBookings.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Inbox = lazy(() => import("./pages/Inbox.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
import RequireAuth from "./components/RequireAuth.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import StatusMessage from "./components/StatusMessage.jsx";

// Browser tab title for each page (helps users and screen readers).
const TITLES = {
  "/": "Explore Malaysia | Discover Malaysia, Create Memories",
  "/packages": "Travel Packages",
  "/about": "About Us",
  "/contact": "Contact us",
  "/login": "Log in",
  "/signup": "Create an account",
  "/profile": "My profile",
  "/terms": "Terms & Conditions",
  "/my-bookings": "My bookings",
  "/forgot-password": "Reset your password",
  "/inbox": "Inbox",
  "/admin": "Admin dashboard",
};
const titleFor = (path) =>
  TITLES[path] ||
  (path.startsWith("/packages/") ? "Package details" : path.startsWith("/book/") ? "Book your trip" : path.startsWith("/payment/") ? "Payment" : path.startsWith("/bookings/") ? "Booking details" : "Page not found");

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const title = titleFor(pathname);
    document.title = pathname === "/" ? title : `${title} | Explore Malaysia`;
    document.getElementById("main")?.focus({ preventScroll: true }); // move keyboard/screen-reader focus to the new page
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary key={pathname}>
        <Suspense fallback={<section className="container section"><StatusMessage type="loading" title="Loading..." /></section>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:id" element={<PackageDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/book/:id" element={<RequireAuth><Booking /></RequireAuth>} />
          <Route path="/payment/:bookingId" element={<RequireAuth><Payment /></RequireAuth>} />
          <Route path="/bookings/:bookingId" element={<RequireAuth><BookingConfirmation /></RequireAuth>} />
          <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/inbox" element={<RequireAuth><Inbox /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}