import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/status`, {
          credentials: 'include' // CRITICAL: Sends the cookie to Go
        });
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Ensure this function is INSIDE the AuthProvider so it can access setIsAuthenticated
  const logout = async () => {
    try {
      // 1. Tell Go to delete the session from the DB
      await fetch(`${baseUrl}}/api/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      // 2. FORCE the state to update
      setIsAuthenticated(false);
      
      // 3. Clear any local storage if you have it
      localStorage.removeItem('isAuthenticated');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    // FIXED: Added `logout` to the value object here!
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};