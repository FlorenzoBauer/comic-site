import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import '../App.css';

function Navbar() {
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); 

  useEffect(() => {
    const savedTheme = localStorage.getItem('vault-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('vault-theme', newTheme);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const path = location.pathname.includes('collectables') ? '/collectables' : '/';
    navigate(`${path}?search=${encodeURIComponent(query)}`);
  };

  const getLinkClass = (path) => (location.pathname === path ? 'active-link' : '');

  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <div className="nav-group">
          <Link to="/" className="nav-logo">Vault<span className="logo-accent">_</span></Link>
          
          <button onClick={logout} className="btn-logout" title="Exit Vault">
            <LogOut size={12} />
            <span>LOGOUT</span>
          </button>
          
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-links">
            <Link to="/" className={getLinkClass('/')}>Comics</Link>
            <Link to="/collectables" className={getLinkClass('/collectables')}>Collectables</Link>
          </div>
          <div className="nav-utilities">
            <form onSubmit={handleSearch} className="search-box">
              <Search size={14} className="search-icon" />
              <input type="text" className="search-input" placeholder="Query Archive..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </form>
            <Link to="/upload" className="btn-add"><Plus size={16} /></Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;