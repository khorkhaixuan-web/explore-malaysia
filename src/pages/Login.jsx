import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  
  if (user && !busy) return <Navigate to="/profile" replace />;

  const validate = (v) => {
    const found = {};
    if (!v.email.trim()) found.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) found.email = "Please enter a valid email address.";
    if (!v.password) found.password = "Password is required.";
    return found;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
    setLoginError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await login(form);
    if (!result.ok) {
      setLoginError(result.error);
      setBusy(false);
      return;
    }
    
    navigate(result.user.role === "admin" ? "/admin" : result.user.profile.completed ? location.state?.from || "/packages" : "/profile", { replace: true });
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">Log in</h1>
      <p className="page-sub">Welcome back! Log in to view and manage your personal profile.</p>

      {loginError && <StatusMessage type="error" title="Login failed">{loginError}</StatusMessage>}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField id="password" label="Password" type="password" placeholder="Your password" autoComplete="current-password" value={form.password} onChange={handleChange} error={errors.password} />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
        <p className="auth-switch"><Link to="/forgot-password">Forgot your password?</Link></p>
        <p className="auth-switch">New to Explore Malaysia? <Link to="/signup">Create an account</Link></p>
      </form>
    </section>
  );
}