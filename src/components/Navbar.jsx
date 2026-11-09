import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { unreadCount } from "../mail.js";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/packages", label: "Packages" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">✈</span> Explore Malaysia
        </Link>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>

        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}

          {/* NEW FEATURE 5: login / logout area */}
          <div className="nav-auth">
            {user ? (
              <>
                {isAdmin && <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} onClick={() => setOpen(false)}>Admin</NavLink>}
                <NavLink to="/inbox" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} onClick={() => setOpen(false)}>
                  Inbox{unreadCount(user.email) > 0 ? ` (${unreadCount(user.email)})` : ""}
                </NavLink>
                <NavLink to="/my-bookings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} onClick={() => setOpen(false)}>My bookings</NavLink>
                <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} onClick={() => setOpen(false)}>
                  👤 {user.profile.fullName.split(" ")[0]}
                </NavLink>
                <button type="button" className="nav-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} onClick={() => setOpen(false)}>Log in</NavLink>
                <Link to="/signup" className="nav-signup" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}