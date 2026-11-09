import { createContext, useContext, useState } from "react";


const USERS_KEY = "explore-malaysia-users"; // all registered accounts
const SESSION_KEY = "explore-malaysia-session"; // email of the logged-in user

import { sendMail } from "../mail.js";

// Demo admin account (created the first time someone logs in with it). Change these before a real launch.
export const ADMIN_EMAIL = "admin@exploremalaysia.com";
const ADMIN_PASSWORD = "admin123";
const RESET_KEY = "explore-malaysia-resets"; // password reset codes
const RESET_MINUTES = 15;
const MAX_RESET_TRIES = 5;

const AuthContext = createContext(null);

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage not available - ignore */
  }
};

// Passwords are never stored as plain text: they are hashed with SHA-256 first, together with a random
// per-user salt (so two users with the same password get different hashes). Accounts created before the
// salt was added are still accepted and are upgraded the next time that user logs in.
// NOTE: this is demo-grade security. A real site must hash passwords on a server (bcrypt/argon2).
const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hashPassword(text, salt = "") {
  text = salt + text;
  try {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return btoa(unescape(encodeURIComponent(text))); // fallback if crypto is unavailable
  }
}

// Remove the password hash before giving the user to the rest of the app.
const publicUser = ({ passwordHash, salt, ...rest }) => rest; // eslint-disable-line no-unused-vars

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = read(SESSION_KEY, null);
    const found = email ? read(USERS_KEY, []).find((u) => u.email === email) : null;
    return found ? publicUser(found) : null;
  });

  // Create a new account and log the user in straight away.
  const register = async ({ name, email, password }) => {
    const users = read(USERS_KEY, []);
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL || users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const salt = newSalt();
    const newUser = {
      email: cleanEmail,
      salt,
      passwordHash: await hashPassword(password, salt),
      profile: { fullName: name.trim(), phone: "", dob: "", country: "", interest: "", completed: false },
    };
    write(USERS_KEY, [...users, newUser]);
    write(SESSION_KEY, cleanEmail);
    setUser(publicUser(newUser));
    sendMail(cleanEmail, "Welcome to Explore Malaysia", `Hi ${name.trim()},\n\nThanks for joining Explore Malaysia! Complete your profile, then browse our packages and book your next trip.\n\nTip: use code WELCOME10 for 10% off your first booking.\n\nExplore Malaysia`);
    return { ok: true, user: publicUser(newUser) };
  };

  // Check the email + password and start a session.
  const login = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    let found = read(USERS_KEY, []).find((u) => u.email === cleanEmail);
    if (!found && cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const salt = newSalt();
      found = {
        email: ADMIN_EMAIL,
        role: "admin",
        salt,
        passwordHash: await hashPassword(ADMIN_PASSWORD, salt),
        profile: { fullName: "Admin", phone: "", dob: "", country: "Malaysia", interest: "", completed: true },
      };
      write(USERS_KEY, [...read(USERS_KEY, []), found]);
    }
    if (!found || found.passwordHash !== (await hashPassword(password, found.salt || ""))) {
      return { ok: false, error: "Incorrect email or password." };
    }
    if (!found.salt) {
      // upgrade an old unsalted account
      const salt = newSalt();
      found = { ...found, salt, passwordHash: await hashPassword(password, salt) };
      write(USERS_KEY, read(USERS_KEY, []).map((u) => (u.email === cleanEmail ? found : u)));
    }
    write(SESSION_KEY, cleanEmail);
    setUser(publicUser(found));
    return { ok: true, user: publicUser(found) };
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  // Forgot password, step 1: make a 6-digit code (valid 15 minutes) and "e-mail" it.
  // Always answers ok, so nobody can use this form to find out which e-mails have an account.
  const requestPasswordReset = (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!read(USERS_KEY, []).some((u) => u.email === cleanEmail)) return { ok: true, demoEmail: null };
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    write(RESET_KEY, { ...read(RESET_KEY, {}), [cleanEmail]: { code, expiresAt: Date.now() + RESET_MINUTES * 60000, tries: 0 } });
    const demoEmail = sendMail(cleanEmail, "Your password reset code", `Your Explore Malaysia password reset code is ${code}.\n\nIt is valid for ${RESET_MINUTES} minutes. If you did not ask for this, you can ignore this e-mail.`);
    return { ok: true, demoEmail };
  };

  // Forgot password, step 2: check the code and save the new password.
  const resetPassword = async ({ email, code, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const resets = read(RESET_KEY, {});
    const entry = resets[cleanEmail];
    if (!entry || Date.now() > entry.expiresAt) return { ok: false, error: "This code is invalid or has expired. Please request a new one." };
    if (entry.tries >= MAX_RESET_TRIES) return { ok: false, error: "Too many wrong attempts. Please request a new code." };
    if (entry.code !== code.trim()) {
      write(RESET_KEY, { ...resets, [cleanEmail]: { ...entry, tries: entry.tries + 1 } });
      return { ok: false, error: "That code is not correct." };
    }
    const salt = newSalt();
    const passwordHash = await hashPassword(password, salt);
    write(USERS_KEY, read(USERS_KEY, []).map((u) => (u.email === cleanEmail ? { ...u, salt, passwordHash } : u)));
    delete resets[cleanEmail];
    write(RESET_KEY, resets);
    sendMail(cleanEmail, "Your password was changed", "Your Explore Malaysia password was just changed. If this was not you, please contact us straight away.");
    return { ok: true };
  };

  // Save the personal information filled in on the Profile page.
  const updateProfile = (profile) => {
    const users = read(USERS_KEY, []);
    const updated = users.map((u) => (u.email === user.email ? { ...u, profile: { ...profile, completed: true } } : u));
    write(USERS_KEY, updated);
    setUser(publicUser(updated.find((u) => u.email === user.email)));
  };

  return <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", register, login, logout, updateProfile, requestPasswordReset, resetPassword }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);