import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/api.js';
import Navigation from '../../components/Navigation/Navigation';
import ProductCard from '../../components/ProductCard/ProductCard';
import CartItemRow from '../../components/CartItemRow/CartItemRow';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Payment from '../../components/Payment/Payment';
import Receipt from '../../components/Receipt/Receipt';
import './Pos.css';

// Main POS Component
export default function Pos() {
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    toggleAddOn, 
    clearCart,
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

  //computeeffectivestock added by russ - to compute stock remaining across different products...
  const computeEffectiveStock = (product, allProducts, cartItems, targetSize = null) => {
    if (!product.ingredientRequirements || product.ingredientRequirements.length === 0) {
        return product.stock;
    }
    const reservedIngredients = {};

    cartItems.forEach(cartItem => {
        const cartProduct = allProducts.find(p => p.productID === cartItem.productId);
        if (!cartProduct || !cartProduct.ingredientRequirements) return;

        if (cartProduct.productType === 'simpleProduct') {
            cartProduct.ingredientRequirements.forEach(req => {
                reservedIngredients[req.ingredientID] =
                    (reservedIngredients[req.ingredientID] || 0) +
                    (req.quantityRequired * cartItem.quantity);
            });
        } else if (cartProduct.productType === 'drink') {
            const variant = cartProduct.ingredientRequirements.find(
                v => v.size === cartItem.size
            );
            if (variant) {
                variant.ingredients.forEach(req => {
                    reservedIngredients[req.ingredientID] =
                        (reservedIngredients[req.ingredientID] || 0) +
                        (req.quantityRequired * cartItem.quantity);
                });
            }
        } else if (cartProduct.productType === 'flavoredItem') {
            const variant = cartProduct.ingredientRequirements.find(
                v => v.flavorName === cartItem.size
            );
            if (variant) {
                variant.ingredients.forEach(req => {
                    reservedIngredients[req.ingredientID] =
                        (reservedIngredients[req.ingredientID] || 0) +
                        (req.quantityRequired * cartItem.quantity);
                });
            }
        }
    });

    if (product.productType === 'simpleProduct') {
        const capacities = product.ingredientRequirements
            .filter(req => req.quantityRequired > 0)
            .map(req => {
                const reserved = reservedIngredients[req.ingredientID] || 0;
                const remaining = req.stockQuantity - reserved;
                return Math.max(0, Math.floor(remaining / req.quantityRequired));
            });
        return capacities.length ? Math.min(...capacities) : product.stock;

    } else if (product.productType === 'drink') {
        // If a targetSize is specified, only compute for that size
        const relevantVariants = targetSize
            ? product.ingredientRequirements.filter(v => v.size === targetSize)
            : product.ingredientRequirements;

        const variantCapacities = relevantVariants.map(variant => {
            const caps = variant.ingredients
                .filter(req => req.quantityRequired > 0)
                .map(req => {
                    const reserved = reservedIngredients[req.ingredientID] || 0;
                    const remaining = req.stockQuantity - reserved;
                    return Math.max(0, Math.floor(remaining / req.quantityRequired));
                });
            return caps.length ? Math.min(...caps) : Infinity;
        });
        return variantCapacities.length ? Math.min(...variantCapacities) : product.stock;

    } else if (product.productType === 'flavoredItem') {
        const relevantVariants = targetSize
            ? product.ingredientRequirements.filter(v => v.flavorName === targetSize)
            : product.ingredientRequirements;

        const variantCapacities = relevantVariants.map(variant => {
            const caps = variant.ingredients
                .filter(req => req.quantityRequired > 0)
                .map(req => {
                    const reserved = reservedIngredients[req.ingredientID] || 0;
                    const remaining = req.stockQuantity - reserved;
                    return Math.max(0, Math.floor(remaining / req.quantityRequired));
                });
            return caps.length ? Math.min(...caps) : Infinity;
        });
        return variantCapacities.length ? Math.min(...variantCapacities) : product.stock;
    }

    return product.stock;
};

  // UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [addFeedbackText, setAddFeedbackText] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderData, setOrderData] = useState(null);

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
  // trying to count the stock as products are order -russ
const handleAddToCart = (product, quantity, size) => {
    const effectiveStock = computeEffectiveStock(product, products, cartItems, size);
    const alreadyInCart = cartItems
        .filter(item => item.productId === product.productID && item.size === size)
        .reduce((sum, item) => sum + item.quantity, 0);

            console.log('--- handleAddToCart ---');
    console.log('size:', size);
    console.log('effectiveStock for this size:', effectiveStock);
    console.log('alreadyInCart for this size:', alreadyInCart);
    console.log('quantity:', quantity);
    console.log('would block?', alreadyInCart + quantity > effectiveStock);
    console.log('cartItems snapshot:', JSON.stringify(cartItems.map(i => ({ size: i.size, qty: i.quantity, id: i.id }))));

    if (quantity > effectiveStock) {
        return;
    }

    addToCart(product, quantity, size);
    setAddFeedbackText(`${product.name} (${size}) added to cart!`);
    setShowAddFeedback(true);
    setTimeout(() => setShowAddFeedback(false), 2000);
};

  // Handle payment modal opening
  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  // Handle payment modal closing (cancel)
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  // Handle successful payment completion
  const handlePaymentComplete = (order) => {
    setOrderData(order);
    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  // Handle receipt closing
  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setOrderData(null);
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
            {/* Page Title */}
            <h1 className="pos-title">Point of Sale</h1>

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
            <div className="products-container">
              <div className="products-grid">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => {
                      const sizeStockMap = {};
                          if (product.productType === 'drink') {
                              product.ingredientRequirements?.forEach(variant => {
                                  sizeStockMap[variant.size] = computeEffectiveStock(product, products, cartItems, variant.size);
                              });
                          } else if (product.productType === 'flavoredItem') {
                              product.ingredientRequirements?.forEach(variant => {
                                  sizeStockMap[variant.flavorName] = computeEffectiveStock(product, products, cartItems, variant.flavorName);
                              });
                          } else {
                              // simpleProduct — single entry
                              sizeStockMap['Standard'] = computeEffectiveStock(product, products, cartItems);
                          }
                        return (
                            <ProductCard
                                key={product.productID}
                                product={product}
                                onAddToCart={handleAddToCart}
                                sizeStockMap={sizeStockMap}
                            />
                        );
                    })
                ) : (
                    <div className="no-products">No products found</div>
                )}
              </div>
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className="pos-checkout-section">
            <div className="checkout-header">
              <h2>Checkout</h2>
              {cartItems.length > 0 && (
                 <div className="checkout-header-right">
                  <span className="cart-count">{cartItems.length} items</span>
                  <button
                    className="clear-cart-btn"
                    onClick={() => { clearCart(); }}
                    title="Clear cart"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="checkout-items">
              {cartItems.length > 0 ? (
                <div>
                  {cartItems.map(item => {
                      const product = products.find(p => p.productID === item.productId);
                      const effectiveStock = product
                          ? computeEffectiveStock(product, products, cartItems, item.size)
                          : Infinity;

                      //Each rows qty is totalled
                      const otherRowsQty = cartItems
                          .filter(i => i.productId === item.productId && i.size === item.size && i.id !== item.id)
                          .reduce((sum, i) => sum + i.quantity, 0);

                      const availableAddOns = product ? getAvailableAddOnsForProduct(product) : [];
                      const maxQty = Number.isFinite(effectiveStock)
                          ? effectiveStock  + item.quantity
                          : Infinity;

                      const originalStock = product
                        ? computeEffectiveStock(product, products, [], item.size)
                        : maxQty;

                      return (
                          <CartItemRow
                              key={item.id}
                              item={item}
                              onRemove={removeFromCart}
                              onUpdateQty={(itemId, newQty) => {
                                  if (newQty > maxQty) return;
                                  updateQuantity(itemId, newQty);
                              }}
                              onToggleAddOn={toggleAddOn}
                              availableAddOns={availableAddOns}
                              showAddOnsExpandable={availableAddOns.length > 0}
                              maxQty={maxQty}
                              totalStock={originalStock}
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

                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span className="total-amount">₱{totals.total.toFixed(2)}</span>
                </div>

                <div className="checkout-actions">
                  <button 
                    className="btn-checkout" 
                    disabled={cartItems.length === 0}
                    onClick={handleOpenPaymentModal}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Payment 
          cart={cartItems}
          cartTotals={totals}
          onClose={handleClosePaymentModal}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && orderData && (
        <Receipt 
          order={orderData}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
}
