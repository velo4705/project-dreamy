import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./MediaGallery.css";

export default function MediaGallery({ media, mediaUrl, mediaType }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const items = (media && Array.isArray(media) && media.length > 0)
    ? media
    : (mediaUrl ? [{ url: mediaUrl, type: mediaType }] : []);

  if (items.length === 0) return null;

  const isGif = (url) => url?.toLowerCase().endsWith(".gif");

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(index);
    }
  };

  const scrollTo = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="media-carousel-container">
      <div 
        className="media-carousel-scroll" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        {items.map((item, index) => {
          const itemIsGif = isGif(item.url);
          return (
            <div key={index} className={`media-slide ${itemIsGif ? 'is-gif' : ''}`}>
              {/* Ambient Background for everything except GIFs (which fill the frame anyway) */}
              {!itemIsGif && (
                <div className="ambient-bg">
                  {item.type === "video" ? (
                    <video src={item.url} muted />
                  ) : (
                    <img src={item.url} alt="" />
                  )}
                </div>
              )}

              <div className="media-content-wrapper">
                {item.type === "video" ? (
                  <video 
                    src={item.url} 
                    controls 
                    preload="metadata"
                    className="carousel-video"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="" 
                    loading="lazy" 
                    className={itemIsGif ? 'gif-content' : 'image-content'}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <div className="carousel-dots">
            {items.map((_, i) => (
              <div 
                key={i} 
                className={`dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => scrollTo(i)}
              />
            ))}
          </div>
          
          <button className="nav-btn prev" onClick={() => scrollTo(currentIndex - 1)} style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>
            <ChevronLeft size={20} />
          </button>
          <button className="nav-btn next" onClick={() => scrollTo(currentIndex + 1)} style={{ opacity: currentIndex === items.length - 1 ? 0.3 : 1 }}>
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
