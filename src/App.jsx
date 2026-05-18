import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import UpdateIngredient from './pages/UpdateIngredient/UpdateIngredient.jsx';
import AddProduct from './pages/AddProduct/AddProduct.jsx';
import UpdateProduct from './pages/UpdateProduct/UpdateProduct.jsx';
import UserManager from './pages/UserManager/UserManager.jsx';
import Restock from './pages/Restock/Restock.jsx';
import AddAddOn from './pages/AddAddOn/AddAddOn';
import ReportScreen from './pages/ReportScreen/ReportScreen.jsx';
import './css/App.css';
import Pos from './pages/Pos/Pos';
import { CartProvider } from './context/CartContext';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

// Timeout Warning Modal Component
function TimeoutWarning() {
  const { showTimeoutWarning, continueSession, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!showTimeoutWarning) return;

    setTimeLeft(60);
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showTimeoutWarning]);

  if (!showTimeoutWarning) return null;

  return (
    <div className="timeout-warning-overlay">
      <div className="timeout-warning-modal">
        <h2>Session Expiring Soon</h2>
        <p>Your session will expire due to inactivity in:</p>
        <div className="timeout-countdown">{timeLeft} seconds</div>
        <p className="timeout-message">Click "Continue Session" to remain logged in.</p>
        <div className="timeout-actions">
          <button className="btn-continue" onClick={continueSession}>
            Continue Session
          </button>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute>
          <Pos />
        </ProtectedRoute>
      } />
      <Route path = "/inventory" element={
        <ProtectedRoute>
            <Inventory />
        </ProtectedRoute>
      } />
      <Route path = "/inventory/add-product/" element = {
        <ProtectedRoute>
          <AddProduct />
        </ProtectedRoute>
      } />
      <Route path="/inventory/add-addon" element={
          <ProtectedRoute>
              <AddAddOn />
          </ProtectedRoute>
      } />
      <Route path = "/inventory/restock" element = {
        <ProtectedRoute>
          <Restock />
        </ProtectedRoute>
      } />
      <Route path = "/inventory/update-ingredient/:ingredientID" element = {
        <ProtectedRoute>
          <UpdateIngredient />
        </ProtectedRoute>
      } />
      <Route path = "/inventory/update-product/:productID" element = {
        <ProtectedRoute>
          <UpdateProduct />
        </ProtectedRoute>
      } />
      <Route path = "/user-manager" element = {
        <ProtectedRoute>
          <UserManager />
        </ProtectedRoute>
      } />
      <Route path = "/reports" element = {
        <ProtectedRoute>
          <ReportScreen />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}

function AppWithTimeout() {
  return (
    <>
      <AppRoutes />
      <TimeoutWarning />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppWithTimeout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
