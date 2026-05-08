import "./StarryBackground.css";

export default function StarryBackground() {
  return (
    <div className="starry-background">
      <div className="stars-container">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `scale(${Math.random() * 1.5})`
            }}
          />
        ))}
      </div>
      <div className="constellation-overlay"></div>
    </div>
  );
}
