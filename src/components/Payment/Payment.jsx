import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import './Payment.css';

export default function Payment({ cart, cartTotals, onClose, onPaymentComplete }) {
  const [amountTendered, setAmountTendered] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { submitOrder } = useCart();

  // Calculate change in real-time
  const calculateChange = () => {
    const amount = parseFloat(amountTendered) || 0;
    return amount - cartTotals.total;
  };

  const change = calculateChange();
  const isAmountSufficient = change >= 0;

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only valid numbers and decimal point
    if (value === '' || !isNaN(value)) {
      setAmountTendered(value);
    }
  };

  // Handle payment submission
  const handlePayNow = async () => {
    // Validate amount
    if (!amountTendered || !isAmountSufficient) {
      setError('Please enter a sufficient cash amount');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      // Call submitOrder from CartContext which handles the full payment flow
      const order = await submitOrder('cash', token);
      
      if (order) {
        // Payment successful - pass order data back to Pos component
        onPaymentComplete(order);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h2>Payment</h2>
          <button className="payment-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-content">
          {/* Order Summary */}
          <div className="payment-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Subtotal:</span>
              <span>₱{cartTotals.subtotal.toFixed(2)}</span>
            </div>
            
            {cartTotals.discountAmount > 0 && (
              <div className="summary-item discount">
                <span>Discount:</span>
                <span>−₱{cartTotals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="summary-item total">
              <span>Total Amount Due:</span>
              <span className="amount-due">₱{cartTotals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Input Section */}
          <div className="payment-form">
            <div className="form-group">
              <label htmlFor="amount-tendered">Cash Tendered</label>
              <input
                id="amount-tendered"
                type="number"
                placeholder="₱ 0.00"
                value={amountTendered}
                onChange={handleAmountChange}
                className="amount-input"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>

            {/* Change Display */}
            <div className="form-group">
              <label>Change</label>
              <div className={`change-display ${isAmountSufficient && amountTendered ? 'sufficient' : 'insufficient'}`}>
                {amountTendered ? `₱${change.toFixed(2)}` : '₱0.00'}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="payment-error">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="payment-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn-pay"
            onClick={handlePayNow}
            disabled={!isAmountSufficient || isLoading}
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
