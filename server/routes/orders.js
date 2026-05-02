import express from 'express';
import jwt from 'jsonwebtoken';
import {
    createOrder,
    addOrderItem,
    addOrderItemAddOn,
    calculateOrderTotal,
    getOrderHistory,
    finalizeOrder,
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
        for (const item of items) {
            const { productId, size, quantity, priceAtTime } = item;

            const itemResult = await addOrderItem(
            orderId,
            productId,
            size,
            quantity,
            priceAtTime
            );
            const orderItemId = itemResult.orderItemID || itemResult.order_item_id || itemResult[0];

            // Add add-ons for this item if provided
             const itemAddOns = addOns[orderItemId] || [];
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
 * Body: { paymentMethod, taxAmount }
 */
router.post('/:orderId/complete', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentMethod, taxAmount } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'paymentMethod is required',
            });
        }

        // Calculate final total
        const totals = await calculateOrderTotal(orderId);

        // Finalize the order in database
        const success = await finalizeOrder(orderId, paymentMethod, taxAmount || 0);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        res.json({
            success: true,
            data: {
                orderId,
                status: 'completed',
                paymentMethod,
                totals,
            },
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
