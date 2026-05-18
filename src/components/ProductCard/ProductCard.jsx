import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart, sizeStockMap = {} }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]?.label || null);
  const allSizesOutOfStock = product.sizes.every(size => {
    const stock = size.label in sizeStockMap ? sizeStockMap[size.label] : (product.stock ?? 0);
    return stock === 0;
  });


  const currentStock = selectedSize in sizeStockMap
      ? sizeStockMap[selectedSize]
      : (product.stock ?? 0);

  const isOutOfStock = currentStock === 0;

  const handleAddClick = () => {
    if (!isOutOfStock && selectedSize) {
      onAddToCart(product, 1, selectedSize);
    }
  };

  const selectedSizeObj = product.sizes.find(s => s.label === selectedSize);
  const selectedPrice = selectedSizeObj ? selectedSizeObj.price : 0;

  return (
    <div className={`product-card ${allSizesOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image">
        <img src={product.image || '/products/default.png'} alt={product.name} onError={(e) => { e.target.src = '/products/default.png'; }} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && <p className="product-desc">{product.description}</p>}
        
        {product.sizes.length > 0 && (
          <div className="product-sizes">
            {product.sizes.map(size => {
              const sizeStock = size.label in sizeStockMap
                  ? sizeStockMap[size.label]
                  : (product.stock ?? 0);
              const sizeOutOfStock = sizeStock === 0;
              return (
                  <button
                      key={size.label}
                      className={`size-btn ${selectedSize === size.label ? 'active' : ''} ${sizeOutOfStock ? 'size-btn-out' : ''}`}
                      onClick={() => !sizeOutOfStock && setSelectedSize(size.label)}
                      disabled={sizeOutOfStock}
                      title={sizeOutOfStock ? 'Out of stock' : `${sizeStock} available`}
                  >
                      {size.label}
                  </button>
              );
            })}
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
        {allSizesOutOfStock ? 'Out of Stock' : isOutOfStock ? 'Size Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
