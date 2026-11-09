import { useEffect, useState } from "react";
import { getMedia } from "../media.js";

// Shows one stored photo/video. Props: item { id, type, name }, or a ready url (for files not saved yet).
export default function MediaView({ item, url: directUrl }) {
  const [url, setUrl] = useState(directUrl || "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (directUrl) {
      setUrl(directUrl);
      return undefined;
    }
    let objectUrl = "";
    let cancelled = false;
    getMedia(item.id)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) return setFailed(true);
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item?.id, directUrl]);

  if (failed) return <div className="media-thumb media-missing">Unavailable</div>;
  if (!url) return <div className="media-thumb media-loading" aria-busy="true" />;
  return item.type === "video" ? (
    <video className="media-thumb" src={url} controls preload="metadata" />
  ) : (
    <a href={url} target="_blank" rel="noreferrer" className="media-link">
      <img className="media-thumb" src={url} alt={item.name || "Review photo"} loading="lazy" />
    </a>
  );
}
