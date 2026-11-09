import { useState } from "react";
import FormField from "./FormField.jsx";
import StarInput from "./StarInput.jsx";
import StarRating from "./StarRating.jsx";
import StatusMessage from "./StatusMessage.jsx";
import MediaView from "./MediaView.jsx";
import { ACCEPT, MAX_IMAGE_MB, MAX_MEDIA, MAX_VIDEO_MB, checkFile, compressImage, deleteMedia, mediaType, newMediaId, putMedia } from "../media.js";
import { MAX_COMMENT, deleteReview, formatDateTime, reviewState, saveReview } from "../bookings.js";

// Rate + comment on a paid booking. Props: booking, onChange(updatedBooking)
export default function ReviewSection({ booking, onChange }) {
  const { allowed, reason } = reviewState(booking);
  const [editing, setEditing] = useState(!booking.review);
  const [rating, setRating] = useState(booking.review?.rating || 0);
  const [comment, setComment] = useState(booking.review?.comment || "");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const savedMedia = booking.review?.media || [];
  const [items, setItems] = useState(savedMedia); // saved items {id,type,name} + new ones {file,type,name,previewUrl,key}
  const [saving, setSaving] = useState(false);

  if (booking.status !== "paid") return null;

  if (!allowed) {
    return (
      <div className="review-box no-print">
        <h2>Rate your trip</h2>
        <StatusMessage type="info" title="Not open yet">{reason}</StatusMessage>
      </div>
    );
  }

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file again
    const problems = [];
    const added = [];
    picked.forEach((file) => {
      const problem = checkFile(file);
      if (problem) return problems.push(problem);
      if (items.length + added.length >= MAX_MEDIA) return problems.length || problems.push(`You can add up to ${MAX_MEDIA} photos/videos.`);
      added.push({ key: newMediaId(), file, type: mediaType(file), name: file.name, previewUrl: URL.createObjectURL(file) });
    });
    setItems((list) => [...list, ...added]);
    setErrors((errs) => ({ ...errs, media: problems.join(" ") || undefined }));
  };

  const removeItem = (item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((list) => list.filter((x) => x !== item));
  };

  const resetEditor = () => {
    items.forEach((x) => x.previewUrl && URL.revokeObjectURL(x.previewUrl));
    setItems(booking.review?.media || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!rating) found.rating = "Please choose a star rating.";
    if (comment.length > MAX_COMMENT) found.comment = `Comment must be ${MAX_COMMENT} characters or fewer.`;
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const media = [];
      for (const item of items) {
        if (!item.file) {
          media.push(item);
          continue;
        }
        const blob = item.type === "image" ? await compressImage(item.file) : item.file;
        const id = newMediaId();
        await putMedia(id, blob);
        media.push({ id, type: item.type, name: item.name });
      }
      // files removed from an existing review
      const keep = new Set(media.map((m) => m.id));
      await Promise.all(savedMedia.filter((m) => !keep.has(m.id)).map((m) => deleteMedia(m.id)));
      items.forEach((x) => x.previewUrl && URL.revokeObjectURL(x.previewUrl));
      onChange(saveReview(booking.id, { rating, comment: comment.trim(), media }));
      setItems(media);
      setEditing(false);
      setNotice("Thank you! Your review has been saved.");
    } catch {
      setErrors({ media: "Could not save your photos/videos (browser storage may be full). Try fewer or smaller files." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    savedMedia.forEach((m) => deleteMedia(m.id));
    onChange(deleteReview(booking.id));
    setItems([]);
    setRating(0);
    setComment("");
    setEditing(true);
    setNotice("Your review was deleted.");
  };

  return (
    <div className="review-box no-print">
      <h2>{booking.review ? "Your review" : "Rate your trip"}</h2>
      {notice && <StatusMessage type="success" title={notice} />}

      {!editing && booking.review ? (
        <div className="review-card">
          <StarRating value={booking.review.rating} />
          {booking.review.comment && <p className="review-text">{booking.review.comment}</p>}
          {savedMedia.length > 0 && (
            <div className="media-grid">
              {savedMedia.map((m) => <MediaView key={m.id} item={m} />)}
            </div>
          )}
          <p className="muted small">Posted {formatDateTime(booking.review.updatedAt)}. Your review is shown publicly on the package page.</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setEditing(true); setNotice(""); }}>Edit review</button>
            <button type="button" className="btn-link" onClick={handleDelete}>Delete review</button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <p className="muted small">How was your trip to {booking.destination}? Your first name and last initial will be shown with your review.</p>
          <StarInput value={rating} onChange={(n) => { setRating(n); setErrors({ ...errors, rating: undefined }); }} error={errors.rating} />
          <FormField
            id="comment"
            label="Comment (optional)"
            as="textarea"
            rows="4"
            maxLength={MAX_COMMENT}
            placeholder="Tell other travellers about the guide, activities, food, value for money..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            error={errors.comment}
          />
          <p className="muted small char-count">{comment.length}/{MAX_COMMENT}</p>

          <div className={errors.media ? "field has-error" : "field"}>
            <label htmlFor="media">Photos &amp; videos (optional)</label>
            <input id="media" type="file" accept={ACCEPT} multiple onChange={addFiles} disabled={saving || items.length >= MAX_MEDIA} />
            <span className="muted small">Up to {MAX_MEDIA} files. Photos max {MAX_IMAGE_MB} MB, videos max {MAX_VIDEO_MB} MB (MP4, WebM, MOV). They will be shown publicly with your review.</span>
            {errors.media && <span className="error-text">{errors.media}</span>}
          </div>
          {items.length > 0 && (
            <div className="media-grid">
              {items.map((item) => (
                <div className="media-item" key={item.id || item.key}>
                  <MediaView item={item} url={item.previewUrl} />
                  <button type="button" className="media-remove" onClick={() => removeItem(item)} disabled={saving} aria-label={`Remove ${item.name}`}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="hero-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : booking.review ? "Save changes" : "Submit review"}</button>
            {booking.review && <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setRating(booking.review.rating); setComment(booking.review.comment); resetEditor(); setErrors({}); }}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  );
}
