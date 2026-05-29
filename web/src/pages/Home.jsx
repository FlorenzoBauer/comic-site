import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter } from 'lucide-react';
import ComicCard from '../components/ComicCard';
import '../App.css';

function Home() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [allComics, setAllComics] = useState([]); // Raw data from DB
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();

  // Filter States
  const [priceFilter, setPriceFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  const searchQuery = new URLSearchParams(location.search).get('search') || "";

  useEffect(() => {
    fetch(`${baseUrl}/api/comics?search=${searchQuery}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setAllComics(Array.isArray(data) ? data : []);
        // Reset filters when a new search is performed
        setPriceFilter('all');
        setYearFilter('all');
        setLangFilter('all');
        setConditionFilter('all');
      })
      .catch(err => console.error("Search Error:", err));
  }, [searchQuery]);

  // --- DATA CLEANUP HELPERS ---
  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/\b(19|20)\d{2}\b/); // Finds 19xx or 20xx
    return match ? match[0] : null;
  };

  const normalizeText = (str) => {
    if (!str) return null;
    return String(str).trim().toUpperCase(); // Removes trailing spaces and standardizes case
  };

  // Dynamically extract unique, cleaned values for dropdowns
  const uniqueYears = [...new Set(allComics.map(c => extractYear(c.date)).filter(Boolean))].sort((a, b) => b - a);
  const uniqueLangs = [...new Set(allComics.map(c => normalizeText(c.language)).filter(Boolean))].sort();
  const uniqueConditions = [...new Set(allComics.map(c => normalizeText(c.condition)).filter(Boolean))].sort();

  // Apply filters to the raw data
  const filteredComics = useMemo(() => {
    return allComics.filter(c => {
      // 1. Price Check
      let priceMatch = true;
      const price = parseFloat(c.online_price || c.cover_price || 0);
      if (priceFilter === 'under20') priceMatch = price < 20;
      else if (priceFilter === '20to50') priceMatch = price >= 20 && price <= 50;
      else if (priceFilter === 'over50') priceMatch = price > 50;

      // 2. Year Check (Compare extracted year)
      const itemYear = extractYear(c.date);
      const yearMatch = yearFilter === 'all' || itemYear === yearFilter;

      // 3. Language Check (Compare normalized text)
      const itemLang = normalizeText(c.language);
      const langMatch = langFilter === 'all' || itemLang === langFilter;

      // 4. Condition Check (Compare normalized text)
      const itemCond = normalizeText(c.condition);
      const conditionMatch = conditionFilter === 'all' || itemCond === conditionFilter;

      return priceMatch && yearMatch && langMatch && conditionMatch;
    });
  }, [allComics, priceFilter, yearFilter, langFilter, conditionFilter]);

  return (
    <div className="vault-shell">
      <div className="page-header">
        <div className="header-title-row">
          <div>
            <h1>Comic Database<span style={{color: 'var(--accent-blue)'}}>.</span></h1>
            <p className="section-subtitle"> Media / Section_01</p>
          </div>
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> DATA_FILTERS
          </button>
        </div>

        {/* FILTER TRAY */}
        {showFilters && (
          <div className="filter-tray">
            <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="filter-select">
              <option value="all">ALL_PRICES</option>
              <option value="under20">Under $20</option>
              <option value="20to50">$20 - $50</option>
              <option value="over50">Over $50</option>
            </select>

            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="filter-select">
              <option value="all">ALL_YEARS</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="filter-select">
              <option value="all">ALL_LANGUAGES</option>
              {uniqueLangs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="filter-select">
              <option value="all">ALL_CONDITIONS</option>
              {uniqueConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <span className="filter-results-count">MATCHES: {filteredComics.length}</span>
          </div>
        )}
      </div>

      <div className="archive-grid">
        {filteredComics.length > 0 ? (
          filteredComics.map(c => <ComicCard key={c.id} comic={c} />)
        ) : (
          <div className="empty-state">NO_MATCHING_RECORDS_FOUND</div>
        )}
      </div>
    </div>
  );
}

export default Home;