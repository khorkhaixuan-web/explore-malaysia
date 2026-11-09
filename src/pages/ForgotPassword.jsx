import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

// Forgot password: 1) enter e-mail -> a 6-digit code is "e-mailed"  2) enter the code + a new password.
// DEMO: no real e-mail is sent, so the e-mail is shown on screen (and saved in the Inbox of that account).
export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [demoEmail, setDemoEmail] = useState(null);
  const [form, setForm] = useState({ code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendCode = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErrors({ email: "Please enter a valid email address." });
    setErrors({});
    const result = requestPasswordReset(email);
    setDemoEmail(result.demoEmail);
    setStep(2);
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setFormError("");
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^\d{6}$/.test(form.code.trim())) found.code = "Enter the 6-digit code from the e-mail.";
    if (form.password.length < 6) found.password = "Password must be at least 6 characters.";
    if (form.confirm !== form.password) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const result = await resetPassword({ email, code: form.code, password: form.password });
    setBusy(false);
    if (!result.ok) return setFormError(result.error);
    setDone(true);
  };

  if (done) {
    return (
      <section className="container section narrow">
        <h1 className="page-title">Password changed</h1>
        <StatusMessage type="success" title="Your password was updated.">You can now log in with your new password.</StatusMessage>
        <Link to="/login" className="btn btn-primary">Go to log in</Link>
      </section>
    );
  }

  return (
    <section className="container section narrow">
      <h1 className="page-title">Reset your password</h1>
      <p className="page-sub">{step === 1 ? "Enter your account e-mail and we will send you a 6-digit code." : `If ${email.trim()} has an account, a code was sent. It is valid for 15 minutes.`}</p>

      {step === 1 ? (
        <form className="form" onSubmit={sendCode} noValidate>
          <FormField id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }} error={errors.email} />
          <button type="submit" className="btn btn-primary">Send code</button>
          <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
        </form>
      ) : (
        <>
          {demoEmail && (
            <div className="demo-mail">
              <strong>Demo mode: no real e-mail is sent.</strong> This is the e-mail you would receive:
              <p><b>Subject:</b> {demoEmail.subject}</p>
              <pre className="mail-body">{demoEmail.body}</pre>
            </div>
          )}
          {formError && <StatusMessage type="error" title="Could not reset password">{formError}</StatusMessage>}
          <form className="form" onSubmit={save} noValidate>
            <FormField id="code" label="6-digit code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={form.code} onChange={change} error={errors.code} />
            <FormField id="password" label="New password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={change} error={errors.password} />
            <FormField id="confirm" label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={change} error={errors.confirm} />
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Change password"}</button>
            <button type="button" className="btn-link" onClick={() => { setStep(1); setFormError(""); }}>Use a different email / send a new code</button>
          </form>
        </>
      )}
    </section>
  );
}
