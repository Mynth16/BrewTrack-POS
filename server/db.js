import mysql from 'mysql2/promise.js';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'brewtrackdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export async function getAccountByUsername(username) {
    try {
        const [rows] = await pool.query(
            'SELECT accountID, username, password, role, status FROM account WHERE username = ?',
            [username]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function getIngredientList() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM `ingredient`'
    );
    return rows || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}




export async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

// Product Database Functions
export async function getProductMenu() {
    try {
        const [rows] = await pool.query('CALL sp_GetProductMenu()');
        return rows[0] || [];
    } catch (error) {
        console.error('Error getting product menu:', error);
        throw error;
    }
}

export async function getProductVariants(productId) {
    try {
        const [rows] = await pool.query('CALL sp_GetProductVariants(?)', [productId]);
        return rows[0] || [];
    } catch (error) {
        console.error('Error getting product variants:', error);
        throw error;
    }
}

export async function getAvailableAddOns(productId) {
    try {
        const [rows] = await pool.query('CALL sp_GetAvailableAddOns(?)', [productId]);
        return rows[0] || [];
    } catch (error) {
        console.error('Error getting available add-ons:', error);
        throw error;
    }
}

// Order Database Functions
export async function createOrder(accountId, discountPercent) {
    try {
        const [rows] = await pool.query('CALL sp_CreateOrder(?, ?)', [accountId, discountPercent]);
        return rows[0][0] || null; // Returns { orderID }
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

export async function addOrderItem(orderId, productId, size, quantity, priceAtTime) {
    try {
        const [rows] = await pool.query('CALL sp_AddOrderItem(?, ?, ?, ?, ?)', 
            [orderId, productId, size, quantity, priceAtTime]);
        return rows[0][0] || null; // Returns { orderItemID }
    } catch (error) {
        console.error('Error adding order item:', error);
        throw error;
    }
}

export async function addOrderItemAddOn(orderItemId, addOnId, price, quantity) {
    try {
        await pool.query('CALL sp_AddOrderItemAddOn(?, ?, ?, ?)', 
            [orderItemId, addOnId, price, quantity]);
        return { success: true };
    } catch (error) {
        console.error('Error adding order item add-on:', error);
        throw error;
    }
}

export async function calculateOrderTotal(orderId) {
    try {
        const [rows] = await pool.query('CALL sp_CalculateOrderTotal(?)', [orderId]);
        return rows[0][0] || null;
    } catch (error) {
        console.error('Error calculating order total:', error);
        throw error;
    }
}

export async function getOrderHistory(orderId) {
    try {
        const [rows] = await pool.query('CALL sp_GetOrderHistory(?)', [orderId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting order history:', error);
        throw error;
    }
}

export async function finalizeOrder(orderId, paymentMethod, taxAmount) {
    try {
        const query = `UPDATE orders SET paymentMethod = ?, taxAmount = ?, status = 'completed' WHERE orderID = ?`;
        const [result] = await pool.query(query, [paymentMethod, taxAmount, orderId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error finalizing order:', error);
        throw error;
    }
}

export default pool;
