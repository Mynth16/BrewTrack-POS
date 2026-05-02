import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [taxPercent, setTaxPercent] = useState(12); // Default 12% tax

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('brewtrack_cart');
        if (savedCart) {
            try {
                const { items, discount, tax } = JSON.parse(savedCart);
                setCartItems(items || []);
                setDiscountPercent(discount || 0);
                setTaxPercent(tax || 12);
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        const cartData = {
            items: cartItems,
            discount: discountPercent,
            tax: taxPercent,
        };
        localStorage.setItem('brewtrack_cart', JSON.stringify(cartData));
    }, [cartItems, discountPercent, taxPercent]);

    // Generate unique ID for cart items (product + size + selected add-ons)
    const generateItemId = (productId, size, addOns = []) => {
        const addOnStr = addOns.sort().join('_');
        return `${productId}_${size}_${addOnStr}`;
    };

    // Add product to cart
    const addToCart = (product, quantity = 1, size = null) => {
        const sizeData = size ? product.sizes.find(s => s.label === size) : null;
        const price = sizeData ? sizeData.price : product.price;

        setCartItems(prevItems => {
            const itemId = generateItemId(product.id, size, []);
            const existingItemIndex = prevItems.findIndex(item => item.id === itemId);

            if (existingItemIndex > -1) {
                // Item already exists, increment quantity
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                // Add new item
                const newItem = {
                    id: itemId,
                    productId: product.id,
                    productName: product.name,
                    size: size || 'N/A',
                    price: price,
                    quantity: quantity,
                    addOns: [], // Array of { id, name, price }
                    image: product.image,
                };
                return [...prevItems, newItem];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (itemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    // Update quantity
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    // Toggle add-on for a cart item
    const toggleAddOn = (itemId, addOn) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id !== itemId) return item;

                const existingIndex = item.addOns.findIndex(a => a.id === addOn.id);
                let updatedAddOns;

                if (existingIndex > -1) {
                    // Remove add-on
                    updatedAddOns = item.addOns.filter((_, i) => i !== existingIndex);
                } else {
                    // Add add-on
                    updatedAddOns = [...item.addOns, addOn];
                }

                return { ...item, addOns: updatedAddOns };
            })
        );
    };

    // Clear entire cart
    const clearCart = () => {
        setCartItems([]);
        setDiscountPercent(0);
    };

    // Submit order to backend
    const submitOrder = async (paymentMethod, token) => {
        try {
            if (cartItems.length === 0) {
                throw new Error('Cart is empty');
            }

            // Import services (lazy import to avoid circular dependencies)
            const { orderService } = await import('../services/api.js');

            // Step 1: Create order
            const orderData = await orderService.createOrder(discountPercent, token);
            const orderId = orderData.orderId;

            // Step 2: Prepare items and add-ons for submission
            const items = cartItems.map(item => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
                priceAtTime: item.price,
            }));

            const addOns = {};
            cartItems.forEach((item, index) => {
                if (item.addOns.length > 0) {
                    addOns[index] = item.addOns.map(addOn => ({
                        addOnId: addOn.id,
                        price: addOn.price,
                    }));
                }
            });

            // Step 3: Add items to order
            await orderService.addOrderItems(orderId, items, addOns, token);

            // Step 4: Complete order
            const { totals: calculatedTotals } = calculateTotals();
            const completeData = await orderService.completeOrder(
                orderId,
                paymentMethod,
                calculatedTotals.taxAmount,
                token
            );

            // Step 5: Clear cart on success
            clearCart();

            return completeData;
        } catch (error) {
            console.error('Error submitting order:', error);
            throw error;
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = cartItems.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const addOnsTotal = item.addOns.reduce((addOnSum, addOn) => addOnSum + (addOn.price * item.quantity), 0);
            return sum + itemTotal + addOnsTotal;
        }, 0);

        const discountAmount = (subtotal * discountPercent) / 100;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
        const total = subtotalAfterDiscount + taxAmount;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        };
    };

    const totals = calculateTotals();

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleAddOn,
        clearCart,
        submitOrder,
        discountPercent,
        setDiscountPercent,
        taxPercent,
        setTaxPercent,
        totals,
        itemCount: cartItems.length,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

// Hook to use cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
