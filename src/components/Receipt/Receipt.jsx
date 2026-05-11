import React from 'react';
import './Receipt.css';

export default function Receipt({ order, onClose }) {

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-header">
          <h2>Order Complete!</h2>
          <button className="receipt-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="receipt-content">
          {/* Order Info */}
          <div className="receipt-order-info">
            <div className="order-id">
              <span className="label">Order ID:</span>
              <span className="value">#{order.id}</span>
            </div>
            {order.createdAt && (
              <div className="order-time">
                <span className="label">Time:</span>
                <span className="value">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="receipt-items">
            <h3>Items</h3>
            {order.items && order.items.length > 0 ? (
              <table className="items-table">
                <tbody>
                  {order.items.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="item-row">
                        <td className="item-name">
                          {item.productName} ({item.size})
                        </td>
                        <td className="item-qty">x{item.quantity}</td>
                        <td className="item-price">₱{(item.unitPrice * item.quantity).toFixed(2)}</td>
                      </tr>
                      {/* Display add-ons for this item */}
                      {item.addOns && item.addOns.length > 0 && (
                        <tr className="addon-row">
                          <td colSpan="3" className="addon-details">
                            <em>Add-ons: {item.addOns.join(', ')}</em>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-items">No items in order</p>
            )}
          </div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="total-row subtotal">
              <span>Subtotal:</span>
              <span>₱{order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            
            {order.discountPercent > 0 && (
              <div className="total-row discount">
                <span>Discount ({order.discountPercent}%):</span>
                <span>−₱{order.discountAmount?.toFixed(2) || '0.00'}</span>
              </div>
            )}
            
            <div className="total-row final">
              <span>Total:</span>
              <span className="final-amount">₱{order.totalPrice?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</span>
            </div>

            <div className="total-row payment-method">
              <span>Payment Method:</span>
              <span>{order.paymentMethod || 'Cash'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <button className="btn-close-receipt" onClick={onClose}>
            Back to POS
          </button>
        </div>
      </div>
    </div>
  );
}
