import { useState } from 'react';
import './CartItemRow.css';

export default function CartItemRow({ item, onRemove, onUpdateQty, onToggleAddOn, availableAddOns, showAddOnsExpandable, maxQty}) {
  const [expandAddOns, setExpandAddOns] = useState(false);
  const lineTotal = (item.price * item.quantity) + (item.addOns.reduce((sum, a) => sum + (a.price * item.quantity), 0));
  const  atMaxStock = item.quantity >= maxQty;

  return (
    <div className="cart-item">
      <div className="cart-item-header">
        <div className="cart-item-info">
          <div className="cart-item-name">
            {item.productName} ({item.size})
          </div>
          <div className="cart-item-price">
            ₱{item.price.toFixed(2)} each
          </div>
          {atMaxStock && (
            <div className="cart-item-stock-warning">
              Max stock reached (row cap) ({maxQty})
            </div>
          )}
        </div>
        <div className="cart-item-quantity">
          <button className="qty-btn ${atMaxStock ? 'qty-btn-disabled' : ''}" onClick={() => onUpdateQty(item.id, item.quantity - 1)}>-</button>
            <input
              className="qty-input"
              type="number"
              min="1"
              max={maxQty}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) return;
                if (val > maxQty) {
                  onUpdateQty(item.id, maxQty);
                  return;
                }
                onUpdateQty(item.id, val);
              }}
            />
          <button className="qty-btn ${atMaxStock ? 'qty-btn-disabled' : ''}" onClick={() => onUpdateQty(item.id, item.quantity + 1) } disabled={item.quantity >= maxQty}>+</button>
        </div>
        <div className="cart-item-total">
          ₱{lineTotal.toFixed(2)}
        </div>
        <button className="cart-item-remove" onClick={() => onRemove(item.id)}>🗑</button>
      </div>

      {availableAddOns.length > 0 && (
        <div className="cart-item-addons-section">
          <button 
            className={`addons-toggle ${expandAddOns ? 'expanded' : ''}`}
            onClick={() => setExpandAddOns(!expandAddOns)}
          >
            Add-ons {item.addOns.length > 0 && `(${item.addOns.length})`} ▾
          </button>
          
          {expandAddOns && (
            <div className="addons-list">
              {availableAddOns.map(addOn => {
                const isSelected = item.addOns.some(a => a.id === addOn.id);
                return (
                  <label key={addOn.id} className="addon-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleAddOn(item.id, addOn)}
                    />
                    <span className="addon-name">{addOn.name}</span>
                    <span className="addon-price">+₱{addOn.price.toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
