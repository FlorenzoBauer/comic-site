import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Upload as UploadIcon, X, Check, Loader2 } from 'lucide-react';
import '../App.css';

function Upload() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [type, setType] = useState('comic');
  const [preview, setPreview] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWebImage, setSelectedWebImage] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- IMAGE HANDLING ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSelectedWebImage(null); // Clear web selection if local file picked
    }
  };

  const handleWebSearch = async () => {
    // Pulling both name and number for precision
    const name = document.querySelector('[name="title"], [name="item"]').value;
    const number = document.querySelector('[name="number"]')?.value || "";

    if (!name) return alert("VAULT_ERROR: Identify the subject before scraping.");

    setIsSearching(true);
    setSearchResults([]); // Clear old results

    try {
      // Passing both q (query) and n (number) to your Go backend
      // FIXED: Added credentials: 'include' for the login system
      const res = await fetch(`${baseUrl}/api/scrape-image?q=${encodeURIComponent(name)}&n=${encodeURIComponent(number)}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.images && data.images.length > 0) {
        setSearchResults(data.images);
      } else {
        alert("SCRAPE_ZERO_RESULTS: No visual data found for this query.");
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectWebImage = (url) => {
    setPreview(url);
    setSelectedWebImage(url);
    setSearchResults([]); // Close tray once selected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('entry_type', type);
    
    // If using a web image, we pass the URL string; backend must handle this prioritization
    if (selectedWebImage) {
      formData.append('web_image_url', selectedWebImage);
    }

    // FIXED: Added credentials: 'include' for the login system
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (res.ok) {
      navigate(type === 'comic' ? '/' : '/collectables');
    }
  };

  return (
    <div className="vault-shell">
      <div className="page-header">
        <h1>INTAKE_LAB<span className="logo-accent">_</span></h1>
        <div className="type-toggle">
          <button type="button" onClick={() => setType('comic')} className={type === 'comic' ? 'active' : ''}>COMIC</button>
          <button type="button" onClick={() => setType('collectable')} className={type === 'collectable' ? 'active' : ''}>ARTIFACT</button>
        </div>
      </div>

      <form className="intake-form" onSubmit={handleSubmit}>
        {/* MEDIA HUB: VISUAL IDENTIFICATION */}
        <div className="media-hub">
          <div className="media-preview">
            {preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                referrerPolicy="no-referrer" /* Bypasses many hotlink blocks */
              />
            ) : (
              <div className="preview-placeholder">NO_VISUAL_DATA</div>
            )}
          </div>
          
          <div className="media-controls">
            <button type="button" className="media-btn" onClick={() => fileInputRef.current.click()}>
              <UploadIcon size={16} /> UPLOAD_FILE
            </button>
            <input type="file" ref={fileInputRef} name="image" hidden onChange={handleFileChange} accept="image/*" />
            
            <button type="button" className="media-btn" onClick={() => {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
            }}>
              <Camera size={16} /> CAMERA_CAPTURE
            </button>

            <button 
              type="button" 
              className={`media-btn search-trigger ${isSearching ? 'loading' : ''}`} 
              onClick={handleWebSearch}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 size={16} className="spin" /> : <Search size={16} />} 
              {isSearching ? 'SCRAPING...' : 'SCRAPE_WEB_IMAGE'}
            </button>
          </div>
        </div>

        {/* SEARCH TRAY: APPEARS ONLY WHEN RESULTS FOUND */}
        {searchResults.length > 0 && (
          <div className="search-results-tray">
            <div className="tray-header">
               <span>SELECT_ARCHIVAL_MATCH</span>
               <button type="button" onClick={() => setSearchResults([])}><X size={14}/></button>
            </div>
            <div className="tray-scroll">
              {searchResults.map((url, i) => (
                <div key={i} className="result-card" onClick={() => selectWebImage(url)}>
                  <img 
                    src={url} 
                    alt="Match" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.closest('.result-card').style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA INPUTS */}
        <div className="form-grid">
          <div className="full-width">
             <input name={type === 'comic' ? 'title' : 'item'} className="large-input" placeholder="PRIMARY_NAME / TITLE" required />
          </div>
          {type === 'comic' ? (
            <>
              <input name="number" placeholder="ISSUE_NO" />
              <input name="publisher" placeholder="PUBLISHER" />
              <input name="writer" placeholder="CONTRIBUTOR / WRITER" />
              <input name="online_price" type="number" step="0.01" placeholder="VALUATION ($)" />
              <input name="date" placeholder="PUB_DATE (YYYY)" />
              <input name="language" placeholder="LANGUAGE" defaultValue="English" />
            </>
          ) : (
            <>
              <input name="maker" placeholder="MANUFACTURER" />
              <input name="category" placeholder="CATEGORY" />
              <input name="shelf" placeholder="SHELF_REF" />
              <input name="location" placeholder="LOC_COORD" />
              <input name="cover_price" placeholder="MSRP" />
              <input name="country" placeholder="ORIGIN_COUNTRY" />
            </>
          )}
          <input name="condition" placeholder="PHYSICAL_CONDITION" />
          <input name="owner" placeholder="OWNER / CUSTODIAN" defaultValue="Vault Primary" />
          <textarea name="notes" placeholder="SUPPLEMENTAL_ARCHIVAL_NOTES..." className="full-width"></textarea>
        </div>

        <button type="submit" className="submit-btn">COMMIT_RECORD_TO_VAULT</button>
      </form>
    </div>
  );
}

export default Upload;