import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { name: "", email: "", message: "" };

export default function Contact() {
  
  const { user } = useAuth();
  
  const [form, setForm] = useState(user ? { ...emptyForm, name: user.profile.fullName, email: user.email } : emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (values) => {
    const found = {};
    if (!values.name.trim()) found.name = "Name is required.";
    if (!values.email.trim()) found.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = "Please enter a valid email address.";
    if (!values.message.trim()) found.message = "Message / feedback is required.";
    return found;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined }); 
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setSubmitted(true);
      setForm(user ? { ...emptyForm, name: user.profile.fullName, email: user.email } : emptyForm);
    } else {
      setSubmitted(false);
    }
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">Contact / Feedback</h1>
      <p className="page-sub">Have a question or feedback? Send us a message and we will get back to you.</p>

      {submitted && (
        <div className="status status-success" role="status">
          <div>
            <strong>Thank you!</strong>
            <p>Your message has been sent successfully. We will contact you soon.</p>
          </div>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className={errors.name ? "field has-error" : "field"}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name && <span id="name-error" className="error-text">{errors.name}</span>}
        </div>

        <div className={errors.email ? "field has-error" : "field"}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
          {errors.email && <span id="email-error" className="error-text">{errors.email}</span>}
        </div>

        <div className={errors.message ? "field has-error" : "field"}>
          <label htmlFor="message">Message / Feedback</label>
          <textarea id="message" name="message" rows="5" placeholder="Write your message here..." value={form.message} onChange={handleChange} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />
          {errors.message && <span id="message-error" className="error-text">{errors.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary">Send message</button>
      </form>
    </section>
  );
}