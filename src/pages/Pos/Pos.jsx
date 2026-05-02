import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/api.js';
import Navigation from '../../components/Navigation/Navigation';
import ProductCard from '../../components/ProductCard/ProductCard';
import CartItemRow from '../../components/CartItemRow/CartItemRow';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Pos.css';

// Main POS Component
export default function Pos() {
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    toggleAddOn, 
    discountPercent, 
    setDiscountPercent,
    totals 
  } = useCart();

  // Product data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [addFeedbackText, setAddFeedbackText] = useState('');

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        
        // Assuming API returns { categories, products, addOns }
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setAddOns(data.addOns || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please refresh the page.');
        // Fallback to empty state
        setCategories([]);
        setProducts([]);
        setAddOns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Helper functions for product data
  const getProductsByCategory = (categoryId) => {
    return products.filter(p => p.categoryID === categoryId || p.category === categoryId);
  };

  const getAvailableAddOnsForProduct = (product) => {
    // Product has addOns array from API
    return product.addOns || [];
  };

  const searchProducts = (query) => {
    return products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.productName?.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let results = products;

    if (selectedCategory) {
      results = getProductsByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return results;
  }, [selectedCategory, searchQuery, products]);

  // Handle add to cart with feedback
  const handleAddToCart = (product, quantity, size) => {
    addToCart(product, quantity, size);
    setAddFeedbackText(`${product.name} (${size}) added to cart!`);
    setShowAddFeedback(true);
    setTimeout(() => setShowAddFeedback(false), 2000);
  };

  return (
    <div className="pos-container">
      <Navigation />
      
      {loading && <LoadingSpinner message="Loading menu items..." />}

      {error && (
        <div className="pos-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && (
        <div className="pos-main">
          {/* Product Grid Section */}
          <div className="pos-products-section">
            {/* Search Bar */}
            <div className="pos-search">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Category Filter */}
            <div className="pos-categories">
              <button
                className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Items
              </button>
              {categories.map(cat => (
                <button
                  key={cat.categoryID}
                  className={`category-btn ${selectedCategory === cat.categoryID ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.categoryID)}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>

            {/* Add Feedback Toast */}
            {showAddFeedback && (
              <div className="add-feedback-toast">
                {addFeedbackText}
              </div>
            )}

            {/* Product Grid */}
            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard
                    key={product.productID}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))
              ) : (
                <div className="no-products">No products found</div>
              )}
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className="pos-checkout-section">
            <div className="checkout-header">
              <h2>Checkout</h2>
              {cartItems.length > 0 && (
                <span className="cart-count">{cartItems.length} items</span>
              )}
            </div>

            {/* Cart Items List */}
            <div className="checkout-items">
              {cartItems.length > 0 ? (
                <div>
                  {cartItems.map(item => {
                    const product = products.find(p => p.productID === item.productId);
                    const availableAddOns = product ? getAvailableAddOnsForProduct(product) : [];
                    
                    return (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onRemove={removeFromCart}
                        onUpdateQty={updateQuantity}
                        onToggleAddOn={toggleAddOn}
                        availableAddOns={availableAddOns}
                        showAddOnsExpandable={availableAddOns.length > 0}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="checkout-empty">
                  <p>Cart is empty</p>
                </div>
              )}
            </div>

            {/* Checkout Summary */}
            {cartItems.length > 0 && (
              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="summary-row discount-row">
                  <label>Discount (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="discount-input"
                  />
                </div>

                {totals.discountAmount > 0 && (
                  <div className="summary-row discount-amount">
                    <span>Discount Amount:</span>
                    <span>−₱{totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Tax (12%):</span>
                  <span>₱{totals.taxAmount.toFixed(2)}</span>
                </div>

                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span className="total-amount">₱{totals.total.toFixed(2)}</span>
                </div>

                <div className="checkout-payment-fields">
                  <label>Cash Tendered:</label>
                  <input type="text" placeholder="₱ 0.00" className="payment-input" />

                  <label>Change:</label>
                  <div className="change-display">XXX</div>
                </div>

                <div className="checkout-actions">
                  <button className="btn-checkout" disabled={cartItems.length === 0}>
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
