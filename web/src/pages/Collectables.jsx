import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter } from 'lucide-react';
import CollectableCard from '../components/CollectableCard';
import '../App.css';

function Collectables() {
  const [allItems, setAllItems] = useState([]); // Raw data from DB
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  
  // Filter States
  const [priceFilter, setPriceFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  const searchQuery = new URLSearchParams(location.search).get('search') || "";

  useEffect(() => {
    fetch(`http://localhost:8080/api/collectables?search=${searchQuery}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        if (res.status === 401) {
          console.error("Unauthorized: Redirecting to login");
        }
        return res.json();
      })
      .then(data => {
        setAllItems(Array.isArray(data) ? data : []);
        // Reset filters on new search
        setPriceFilter('all');
        setYearFilter('all');
        setConditionFilter('all');
      })
      .catch(err => console.error("Search Error:", err));
  }, [searchQuery]);

  // --- DATA CLEANUP HELPERS ---
  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : null;
  };

  const normalizeText = (str) => {
    if (!str) return null;
    return String(str).trim().toUpperCase();
  };

  // Dynamically extract unique, cleaned values
  const uniqueYears = [...new Set(allItems.map(i => extractYear(i.date)).filter(Boolean))].sort((a, b) => b - a);
  const uniqueConditions = [...new Set(allItems.map(i => normalizeText(i.condition)).filter(Boolean))].sort();

  // Apply filters
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 1. Price Check (Assuming collectables use cover_price, adjust if you use a different field)
      let priceMatch = true;
      // Strip '$' if it exists in the string, then parse
      const rawPrice = String(item.cover_price || "0").replace(/[^0-9.]/g, '');
      const price = parseFloat(rawPrice || 0);
      
      if (priceFilter === 'under20') priceMatch = price > 0 && price < 20;
      else if (priceFilter === '20to50') priceMatch = price >= 20 && price <= 50;
      else if (priceFilter === 'over50') priceMatch = price > 50;

      // 2. Year Check
      const itemYear = extractYear(item.date);
      const yearMatch = yearFilter === 'all' || itemYear === yearFilter;

      // 3. Condition Check
      const itemCond = normalizeText(item.condition);
      const conditionMatch = conditionFilter === 'all' || itemCond === conditionFilter;

      return priceMatch && yearMatch && conditionMatch;
    });
  }, [allItems, priceFilter, yearFilter, conditionFilter]);

  return (
    <div className="vault-shell">
      <div className="page-header">
        <div className="header-title-row">
          <div>
            <h1>Artifact Archive<span style={{color: 'var(--accent-blue)'}}>.</span></h1>
            <p className="section-subtitle">Non-Print Media / Section_02</p>
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

            <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="filter-select">
              <option value="all">ALL_CONDITIONS</option>
              {uniqueConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <span className="filter-results-count">MATCHES: {filteredItems.length}</span>
          </div>
        )}
      </div>

      <div className="archive-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => <CollectableCard key={item.id} item={item} />)
        ) : (
          <div className="empty-state">NO_MATCHING_RECORDS_FOUND</div>
        )}
      </div>
    </div>
  );
}

export default Collectables;