import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const FALLBACK = "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=400&auto=format&fit=crop";

function ComicCard({ comic }) {
  if (!comic) return null;
const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  // Handle both local uploads and external URLs
  const API_URL = baseUrl;
  const imageSrc = comic.image_url?.startsWith('http') 
    ? comic.image_url 
    : comic.image_url ? `${API_URL}${comic.image_url}` : FALLBACK;

  return (
    <Link to={`/detail/comics/${comic.id}`} className="comic-card">
      {/* Hidden on mobile via CSS Media Query */}
      <div className="poster-frame">
        <img 
          src={imageSrc} 
          onError={(e) => { e.target.src = FALLBACK; }} 
          alt={comic.title} 
        />
      </div>
      
      {/* Title - Becomes the left-side text on mobile */}
      <div className="meta-label">{comic.title}</div>
      
      {/* Meta info - Becomes the right-side text on mobile */}
      <div className="meta-sub">
        <span className="issue-number">
          {comic.number ? `#${comic.number}` : 'N/A'}
        </span>
        <span className="price-tag">
          {comic.online_price ? `$${Number(comic.online_price).toFixed(2)}` : '—'}
        </span>
      </div>
    </Link>
  );
}

export default ComicCard;