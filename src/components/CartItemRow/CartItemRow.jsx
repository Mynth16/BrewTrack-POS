import { useState } from 'react';
import './CartItemRow.css';

export default function CartItemRow({ item, onRemove, onUpdateQty, onToggleAddOn, availableAddOns, showAddOnsExpandable }) {
  const [expandAddOns, setExpandAddOns] = useState(false);
  const lineTotal = (item.price * item.quantity) + (item.addOns.reduce((sum, a) => sum + (a.price * item.quantity), 0));

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
        </div>
        <div className="cart-item-quantity">
          <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.quantity - 1)}>−</button>
          <span className="qty-value">{item.quantity}</span>
          <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.quantity + 1)}>+</button>
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
