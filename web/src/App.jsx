import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext' 
import ProtectedRoute from './components/ProtectedRoute' // Fixed path
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Collectables from './pages/Collectables'
import DetailPage from './pages/DetailPage'
import Upload from './pages/Upload' 
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <main>
          <Routes>
            {/* Public Route - The only open door */}
            <Route path="/login" element={<Login />} />

            {/* All Vault Routes - Locked Tight */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            
            <Route path="/collectables" element={
              <ProtectedRoute>
                <Collectables />
              </ProtectedRoute>
            } />
            
            <Route path="/upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            
            <Route path="/detail/:type/:id" element={
              <ProtectedRoute>
                <DetailPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App