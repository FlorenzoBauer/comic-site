import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit3, Check, X, Trash2 } from 'lucide-react';
import '../App.css';

const FALLBACK = "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=600&auto=format&fit=crop";

function DetailPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [status, setStatus] = useState(null);

  const [holdProgress, setHoldProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // FIXED: Added credentials: 'include'
    fetch(`http://localhost:8080/api/${type}/${id}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
        setEditForm(json);
      })
      .catch(err => console.error("Archive fetch error:", err));
  }, [type, id]);

  if (!data) return <div className="vault-shell">DECRYPTING_RECORD...</div>;

  const API_URL = "http://localhost:8080/";
  const imageSrc = data.image_url?.startsWith('http') 
    ? data.image_url 
    : data.image_url ? `${API_URL}${data.image_url}` : FALLBACK;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "pages") finalValue = parseInt(value, 10) || 0;
    if (name === "online_price") finalValue = parseFloat(value) || 0;
    setEditForm(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleConfirm = async () => {
    setStatus("COMMITTING...");
    try {
      // FIXED: Added credentials: 'include'
      const res = await fetch(`http://localhost:8080/api/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        credentials: 'include',
      });

      if (res.ok) {
        setData(editForm);
        setIsEditing(false);
        setStatus("SUCCESS");
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus("REJECTED");
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      setStatus("OFFLINE");
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const startHold = () => {
    timerRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleDelete();
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  const stopHold = () => {
    clearInterval(timerRef.current);
    setHoldProgress(0);
  };

  const handleDelete = async () => {
    setStatus("PURGING_RECORD...");
    try {
      // FIXED: Added credentials: 'include'
      const res = await fetch(`http://localhost:8080/api/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setStatus("RECORD_PURGED");
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus("DELETE_FAILED");
        setHoldProgress(0);
      }
    } catch (err) {
      setStatus("ERROR_DISCONNECT");
      setHoldProgress(0);
    }
  };

  return (
    <div className="vault-shell">
      <button onClick={() => navigate(-1)} className="btn-back">
        <ChevronLeft size={14} /> BACK_TO_INDEX
      </button>

      <div className="exhibit-container">
        <div className="exhibit-poster">
          <img src={imageSrc} onError={(e) => { e.target.src = FALLBACK; }} alt="Vault Item" />
        </div>

        <div className="exhibit-info">
          <div className="exhibit-header">
            <span className="exhibit-type">{type === 'comics' ? 'RECORD // PUBLICATION' : 'RECORD // ARTIFACT'}</span>
            
            {isEditing ? (
              <input 
                className="edit-input title-edit"
                name={type === 'comics' ? "title" : "item"}
                value={type === 'comics' ? editForm.title : editForm.item}
                onChange={handleInputChange}
                autoFocus
              />
            ) : (
              <h1 className="exhibit-title">{data.title || data.item}</h1>
            )}
            <span className="museum-sub">REFERENCE_ID: {type.toUpperCase()}_{data.id}</span>
          </div>

          <div className="data-grid">
            <DataField label="Contributor" name="writer" value={isEditing ? editForm.writer : data.writer} isEditing={isEditing} onChange={handleInputChange} />
            <DataField label="Valuation" name={type === 'comics' ? "online_price" : "cover_price"} value={isEditing ? (editForm.online_price || editForm.cover_price) : (data.online_price || data.cover_price)} isEditing={isEditing} onChange={handleInputChange} prefix={type === 'comics' ? "$" : ""} />
            <DataField label="Condition" name="condition" value={isEditing ? editForm.condition : data.condition} isEditing={isEditing} onChange={handleInputChange} />

            {type === 'comics' ? (
              <>
                <DataField label="Issue" name="number" value={isEditing ? editForm.number : data.number} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Publisher" name="publisher" value={isEditing ? editForm.publisher : data.publisher} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Language" name="language" value={isEditing ? editForm.language : data.language} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Origin" name="place_of_publication" value={isEditing ? editForm.place_of_publication : data.place_of_publication} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Pages" name="pages" value={isEditing ? editForm.pages : data.pages} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="CGC Grade" name="online_cgc" value={isEditing ? editForm.online_cgc : data.online_cgc} isEditing={isEditing} onChange={handleInputChange} />
              </>
            ) : (
              <>
                <DataField label="Maker" name="maker" value={isEditing ? editForm.maker : data.maker} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Shelf" name="shelf" value={isEditing ? editForm.shelf : data.shelf} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Location" name="location" value={isEditing ? editForm.location : data.location} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Category" name="category" value={isEditing ? editForm.category : data.category} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Language" name="language" value={isEditing ? editForm.language : data.language} isEditing={isEditing} onChange={handleInputChange} />
                <DataField label="Format" name="type" value={isEditing ? editForm.type : data.type} isEditing={isEditing} onChange={handleInputChange} />
              </>
            )}
            <DataField label="Owner" name="owner" value={isEditing ? editForm.owner : data.owner} isEditing={isEditing} onChange={handleInputChange} />
          </div>

          <div className="exhibit-notes">
            <span className="data-label" style={{marginBottom: '5px', display: 'block'}}>Archival Notes</span>
            {isEditing ? (
              <textarea className="edit-input notes-edit" name="notes" value={editForm.notes || ""} onChange={handleInputChange} />
            ) : (
              <p>{data.notes || "No supplemental archival data available."}</p>
            )}
          </div>

          <div className="detail-actions">
            {!isEditing ? (
              <>
                <button className="btn-modify" onClick={() => setIsEditing(true)}>
                  <Edit3 size={14} /> MODIFY_RECORD
                </button>
                <button 
                  className="btn-delete-hold"
                  onMouseDown={startHold}
                  onMouseUp={stopHold}
                  onMouseLeave={stopHold}
                  onTouchStart={startHold}
                  onTouchEnd={stopHold}
                >
                  <Trash2 size={14} />
                  <span>HOLD_TO_PURGE</span>
                  <div className="hold-progress-bar" style={{ width: `${holdProgress}%` }} />
                </button>
              </>
            ) : (
              <div className="action-group">
                <button className="btn-confirm" onClick={handleConfirm}>
                  <Check size={14} /> CONFIRM_COMMIT
                </button>
                <button className="btn-cancel" onClick={() => { setIsEditing(false); setStatus(null); }}>
                  <X size={14} /> CANCEL
                </button>
              </div>
            )}
            {status && <span className="status-indicator">{status}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value, isEditing, onChange, name, prefix = "" }) {
  return (
    <div className="data-point">
      <div className="data-label">{label}</div>
      {isEditing && name ? (
        <input className="edit-input field-edit" name={name} value={value || ""} onChange={onChange} />
      ) : (
        <div className="data-value">{prefix}{value || '—'}</div>
      )}
    </div>
  );
}

export default DetailPage;