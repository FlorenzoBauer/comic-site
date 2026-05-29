import React, { useState } from 'react';
import '../App.css';

function Intake() {
  const [formData, setFormData] = useState({
    title: '', date: '', language: '', condition: '', cover_price: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/comics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (response.ok) {
        alert("Added to Vault.");
        setFormData({ title: '', date: '', language: '', condition: '', cover_price: '' });
      }
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  return (
    <div className="vault-shell">
      <div className="page-header">
        <h1>Intake Terminal<span style={{color: 'var(--accent-blue)'}}>.</span></h1>
        <p className="section-subtitle">Cataloging New Assets</p>
      </div>

      <form className="intake-form" onSubmit={handleSubmit}>
        <input name="title" placeholder="TITLE" value={formData.title} onChange={handleChange} required />
        <input name="date" placeholder="PUBLICATION DATE (YYYY-MM-DD)" value={formData.date} onChange={handleChange} />
        <input name="language" placeholder="LANGUAGE" value={formData.language} onChange={handleChange} />
        <input name="condition" placeholder="CONDITION (e.g. MINT, VG)" value={formData.condition} onChange={handleChange} />
        <input name="cover_price" placeholder="PRICE" value={formData.cover_price} onChange={handleChange} />
        
        <button type="submit" className="submit-btn">COMMIT TO ARCHIVE</button>
      </form>
    </div>
  );
}

export default Intake;