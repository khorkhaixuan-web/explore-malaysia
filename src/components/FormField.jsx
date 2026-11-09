export default function FormField({ id, label, error, as: Tag = "input", children, ...rest }) {
  return (
    <div className={error ? "field has-error" : "field"}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} name={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...rest}>
        {children}
      </Tag>
      {error && <span id={`${id}-error`} className="error-text">{error}</span>}
    </div>
  );
}