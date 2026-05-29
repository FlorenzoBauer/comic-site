import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const FALLBACK = "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?q=80&w=400&auto=format&fit=crop";

function CollectableCard({ item }) {
  if (!item) return null;
const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  // Handle both local uploads and external URLs
  const API_URL = baseUrl;
  const imageSrc = item.image_url?.startsWith('http') 
    ? item.image_url 
    : item.image_url ? `${API_URL}${item.image_url}` : FALLBACK;

  return (
    <Link to={`/detail/collectables/${item.id}`} className="comic-card">
      <div className="collectable-frame">
        <img 
          src={imageSrc} 
          onError={(e) => { e.target.src = FALLBACK; }} 
          alt={item.item} 
        />
      </div>
      
      {/* Left side on mobile Excel view */}
      <div className="meta-label">{item.item}</div>
      
      {/* Right side on mobile Excel view */}
      <div className="meta-sub">
        <span className="item-maker">
          {item.maker || item.category || 'Artifact'}
        </span>
        <span className="price-tag">
          {item.cover_price || '—'}
        </span>
      </div>
    </Link>
  );
}

export default CollectableCard;