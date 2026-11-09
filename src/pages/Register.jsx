import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

const emptyForm = { name: "", email: "", password: "", confirm: "" };

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/profile" replace />;

  const validate = (v) => {
    const found = {};
    if (!v.name.trim()) found.name = "Name is required.";
    if (!v.email.trim()) found.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) found.email = "Please enter a valid email address.";
    if (!v.password) found.password = "Password is required.";
    else if (v.password.length < 6) found.password = "Password must be at least 6 characters.";
    if (!v.confirm) found.confirm = "Please confirm your password.";
    else if (v.confirm !== v.password) found.confirm = "Passwords do not match.";
    return found;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await register(form);
    if (!result.ok) {
      setFormError(result.error);
      setBusy(false);
      return;
    }
    navigate("/profile", { replace: true }); 
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">Create an account</h1>
      <p className="page-sub">Sign up to save your details. You will fill in your personal information in the next step.</p>

      {formError && <StatusMessage type="error" title="Could not create account">{formError}</StatusMessage>}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Name" placeholder="Your full name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
        <FormField id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField id="password" label="Password" type="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField id="confirm" label="Confirm password" type="password" placeholder="Re-enter your password" autoComplete="new-password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Creating account..." : "Sign up"}</button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}