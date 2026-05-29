import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import '../App.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Stores the secure HttpOnly cookie from Go
      });

      if (!response.ok) {
        throw new Error('ACCESS_DENIED: INVALID_CREDENTIALS');
      }

      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        navigate('/'); // Teleport directly to the secured Home catalog
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vault-shell login-wrapper">
      <div className="login-shell">
        
        {/* Cleaned Header Block */}
        <div className="page-header login-header">
          <h1>
            Vault Access<span style={{ color: 'var(--accent-blue)' }}>.</span>
          </h1>
          <p className="section-subtitle">Security / Protocol_01</p>
        </div>

        {/* Terminal Error Banner */}
        {error && (
          <div className="terminal-error">
            {error}
          </div>
        )}

        {/* Form utilizing global and new local layout classes */}
        <form onSubmit={handleLogin} className="intake-form">
          <div className="input-group">
            <label>Operator Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER IDENTITY"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label>Security Key Phrase</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
            style={{ marginTop: '10px', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE SYSTEM'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;