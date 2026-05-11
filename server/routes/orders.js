import express from 'express';
import jwt from 'jsonwebtoken';
import {
    createOrder,
    addOrderItem,
    addOrderItemAddOn,
    calculateOrderTotal,
    getOrderHistory,
    finalizeOrder,
    getVariantIdBySize,
} from '../db.js';

const router = express.Router();


// Middleware to verify JWT token and extract accountID

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
        );
        req.accountID = decoded.accountID;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

/**
 * POST /api/orders
 * Create a new order (status: pending)
 * Body: { discountPercent: number }
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { discountPercent = 0 } = req.body;
        const accountID = req.accountID;

        const orderResult = await createOrder(accountID, discountPercent);
        const orderId = orderResult.orderID || orderResult.order_id || orderResult[0]; // Handle different response formats

        res.json({
            success: true,
            data: {
                orderId,
                accountID,
                status: 'pending',
                discountPercent,
            },
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message,
        });
    }
});

/**
 * POST /api/orders/:orderId/items
 * Add item(s) to an order
 * Body: {
 *   items: [
 *     { productId, size, quantity, priceAtTime },
 *     ...
 *   ],
 *   addOns: { [orderItemId]: [{ addOnId, price }], ... }
 * }
 */
router.post('/:orderId/items', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { items, addOns = {} } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Items array is required and must not be empty',
        });
        }

        const addedItems = [];

        // Add each item to the order
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            const item = items[itemIndex];
            const { productId, size, quantity, priceAtTime } = item;

            // Resolve variant ID from size string
            const variantId = await getVariantIdBySize(productId, size);

            const itemResult = await addOrderItem(
                orderId,
                productId,
                variantId,
                quantity,
                priceAtTime
            );
            const orderItemId = itemResult.orderItemID || itemResult.order_item_id || itemResult[0];

            // Add add-ons for this item if provided
            // Note: addOns object keys are array indices from frontend, not orderItemIds
            const itemAddOns = addOns[itemIndex] || [];
            for (const addOn of itemAddOns) {
                const { addOnId, price } = addOn;
                await addOrderItemAddOn(orderItemId, addOnId, price, quantity);
            }

            addedItems.push({
                orderItemId,
                productId,
                size,
                quantity,
                priceAtTime,
                addOns: itemAddOns,
            });
        }

    res.json({
        success: true,
        data: {
            orderId,
            itemsAdded: addedItems.length,
            items: addedItems,
        },
    });
    } catch (error) {
        console.error('Error adding order items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add items to order',
            message: error.message,
        });
    }
});

/**
 * POST /api/orders/:orderId/complete
 * Finalize an order (mark as completed with payment details)
 * Body: { paymentMethod }
 */
router.post('/:orderId/complete', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentMethod } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'paymentMethod is required',
            });
        }

        // Calculate final total
        const totals = await calculateOrderTotal(orderId);

        // Finalize the order in database
        const success = await finalizeOrder(orderId, paymentMethod);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        // Get full order details for response
        const orderData = await getOrderHistory(orderId);

        // Normalize response field names to match frontend expectations
        // Ensure all numeric fields are converted to numbers
        const normalizedOrder = {
            id: orderData[0]?.orderID || orderId,
            totalPrice: Number(totals?.finalTotal) || 0,
            total: Number(totals?.finalTotal) || 0,
            createdAt: orderData[0]?.dateAndTime,
            paymentMethod,
            discountPercent: Number(totals?.discountPercent) || 0,
            discountAmount: Number(totals?.discountAmount) || 0,
            items: orderData.map(item => {
                // Parse add-ons for this item
                const addOnList = item.addOns && item.addOns.length > 0 && item.addOns !== 'None'
                    ? item.addOns
                        .split(',')
                        .map(a => a.trim())
                        .filter(a => a && a !== 'None')
                    : [];
                
                return {
                    productName: item.productName,
                    size: item.variant || 'N/A',
                    quantity: Number(item.quantity) || 0,
                    unitPrice: Number(item.unitPrice) || 0,
                    lineTotal: Number(item.lineTotal) || 0,
                    addOns: addOnList,
                };
            }),
            subtotal: Number(totals?.subtotal) || 0,
        };

        res.json({
            success: true,
            data: normalizedOrder,
        });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete order',
            message: error.message,
        });
    }
});

/**
 * GET /api/orders/:orderId
 * Fetch full order details (for receipt)
 */
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderData = await getOrderHistory(orderId);

        if (!orderData) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        res.json({
            success: true,
            data: orderData,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            message: error.message,
        });
    }
});

export default router;
