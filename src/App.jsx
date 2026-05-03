import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import UpdateIngredient from './pages/UpdateIngredient/UpdateIngredient.jsx';
import AddProduct from './pages/AddProduct/AddProduct.jsx';
import UpdateProduct from './pages/UpdateProduct/UpdateProduct.jsx';
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

function AppRoutes() {
  return (
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
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
