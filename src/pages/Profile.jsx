import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

const INTERESTS = ["Beach", "Nature", "Heritage", "Adventure", "City"];


export default function Profile() {
  const { user, updateProfile } = useAuth();
  const isNew = !user.profile.completed;

  const [form, setForm] = useState({
    fullName: user.profile.fullName || "",
    phone: user.profile.phone || "",
    dob: user.profile.dob || "",
    country: user.profile.country || "",
    interest: user.profile.interest || "",
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const validate = (v) => {
    const found = {};
    if (!v.fullName.trim()) found.fullName = "Full name is required.";
    if (!v.phone.trim()) found.phone = "Phone number is required.";
    else if (!/^\+?[0-9\s-]{8,15}$/.test(v.phone.trim())) found.phone = "Enter a valid phone number, e.g. 012-3456789.";
    if (!v.dob) found.dob = "Date of birth is required.";
    else if (new Date(v.dob) > new Date()) found.dob = "Date of birth cannot be in the future.";
    if (!v.country.trim()) found.country = "Country is required.";
    if (!v.interest) found.interest = "Please choose a preferred travel category.";
    return found;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        country: form.country.trim(),
        interest: form.interest,
      });
      setSaved(true);
    } else {
      setSaved(false);
    }
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">{isNew && !saved ? "Complete your profile" : "My profile"}</h1>
      <p className="page-sub">
        {isNew && !saved
          ? "Welcome to Explore Malaysia! Please fill in your personal information to finish signing up."
          : "Keep your personal information up to date."}
      </p>

      {saved && (
        <StatusMessage type="success" title="Profile saved!">Your personal information has been saved successfully.</StatusMessage>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField id="email" label="Email (cannot be changed)" type="email" value={user.email} readOnly />
        <FormField id="fullName" label="Full name" placeholder="Your full name" autoComplete="name" value={form.fullName} onChange={handleChange} error={errors.fullName} />
        <div className="form-row">
          <FormField id="phone" label="Phone number" type="tel" placeholder="012-3456789" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
          <FormField id="dob" label="Date of birth" type="date" max={new Date().toISOString().split("T")[0]} value={form.dob} onChange={handleChange} error={errors.dob} />
        </div>
        <div className="form-row">
          <FormField id="country" label="Country" placeholder="e.g. Malaysia" autoComplete="country-name" value={form.country} onChange={handleChange} error={errors.country} />
          <FormField id="interest" label="Preferred travel category" as="select" value={form.interest} onChange={handleChange} error={errors.interest}>
            <option value="">Select a category</option>
            {INTERESTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FormField>
        </div>
        <button type="submit" className="btn btn-primary">{isNew && !saved ? "Save and continue" : "Save changes"}</button>
      </form>
    </section>
  );
}