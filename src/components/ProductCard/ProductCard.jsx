import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]?.label || null);
  const isOutOfStock = product.stock === 0;

  const handleAddClick = () => {
    if (!isOutOfStock && selectedSize) {
      onAddToCart(product, 1, selectedSize);
    }
  };

  const selectedSizeObj = product.sizes.find(s => s.label === selectedSize);
  const selectedPrice = selectedSizeObj ? selectedSizeObj.price : 0;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image">
        <img src="/src/products/default.png" alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        {product.sizes.length > 0 && (
          <div className="product-sizes">
            {product.sizes.map(size => (
              <button
                key={size.label}
                className={`size-btn ${selectedSize === size.label ? 'active' : ''}`}
                onClick={() => setSelectedSize(size.label)}
                disabled={isOutOfStock}
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="product-price">
          ₱{selectedPrice.toFixed(2)}
        </div>
        
        <button
          className="add-to-cart-btn"
          onClick={handleAddClick}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
