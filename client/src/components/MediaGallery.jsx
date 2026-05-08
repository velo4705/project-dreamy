import "./MediaGallery.css";

export default function MediaGallery({ media, mediaUrl, mediaType }) {
  // Use the new 'media' array if available, otherwise fallback to old single items
  const items = (media && Array.isArray(media) && media.length > 0)
    ? media
    : (mediaUrl ? [{ url: mediaUrl, type: mediaType }] : []);

  if (items.length === 0) return null;

  return (
    <div className={`media-gallery count-${Math.min(items.length, 4)}`}>
      {items.map((item, index) => (
        <div key={index} className="media-item">
          {item.type === "video" ? (
            <video src={item.url} controls={items.length === 1} muted={items.length > 1} />
          ) : (
            <img src={item.url} alt="" loading="lazy" />
          )}
        </div>
      ))}
    </div>
  );
}
