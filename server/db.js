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
    const maxRetries = 3;
    const retryDelay = 100; // ms
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const [rows] = await pool.query(
                'SELECT accountID, username, password, role, status FROM account WHERE username = ?',
                [username]
            );
            return rows[0] || null;
        } catch (error) {
            if (attempt < maxRetries - 1 && (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET')) {
                console.warn(`Database connection error, retrying (${attempt + 1}/${maxRetries}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error('Database query error:', error);
                throw error;
            }
        }
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

export async function hashPassword(plainPassword) {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
}

export async function getUserByUsername(username) {
    try {
        const [rows] = await pool.query(
            'SELECT a.accountID, a.username FROM account a WHERE a.username = ?',
            [username]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function getUser(accountID) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                a.accountID,
                a.employeeID,
                a.username,
                a.role,
                a.status,
                e.firstName,
                e.middleName,
                e.lastName,
                e.phoneNumber
            FROM account a
            JOIN employee e ON a.employeeID = e.employeeID
            WHERE a.accountID = ?`,
            [accountID]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function getAllActiveUsers() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                a.accountID,
                a.employeeID,
                a.username,
                a.role,
                a.status,
                e.firstName,
                e.middleName,
                e.lastName,
                e.phoneNumber
            FROM account a
            JOIN employee e ON a.employeeID = e.employeeID
            WHERE a.status = 'Active'
            ORDER BY e.lastName, e.firstName`
        );
        return rows || [];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function createUser(userData) {
    const { firstName, middleName, lastName, phoneNumber, username, role, password } = userData;
    let connection;
    
    try {
        connection = await pool.getConnection();
        
        // Start transaction
        await connection.beginTransaction();
        
        // Insert employee
        const [employeeResult] = await connection.query(
            'INSERT INTO employee (firstName, middleName, lastName, phoneNumber) VALUES (?, ?, ?, ?)',
            [firstName, middleName, lastName, phoneNumber]
        );
        
        const employeeID = employeeResult.insertId;
        
        // Insert account
        const [accountResult] = await connection.query(
            'INSERT INTO account (employeeID, username, role, password, status) VALUES (?, ?, ?, ?, ?)',
            [employeeID, username, role, password, 'Active']
        );
        
        const accountID = accountResult.insertId;
        
        // Commit transaction
        await connection.commit();
        
        return {
            accountID,
            employeeID,
            firstName,
            middleName,
            lastName,
            phoneNumber,
            username,
            role,
            status: 'Active'
        };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error creating user:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function updateUser(accountID, userData) {
    const { firstName, middleName, lastName, phoneNumber, username, role, password } = userData;
    let connection;
    
    try {
        connection = await pool.getConnection();
        
        // Start transaction
        await connection.beginTransaction();
        
        // Get employee ID
        const [accountRows] = await connection.query(
            'SELECT employeeID FROM account WHERE accountID = ?',
            [accountID]
        );
        
        if (!accountRows[0]) {
            throw new Error('Account not found');
        }
        
        const employeeID = accountRows[0].employeeID;
        
        // Update employee
        await connection.query(
            'UPDATE employee SET firstName = ?, middleName = ?, lastName = ?, phoneNumber = ? WHERE employeeID = ?',
            [firstName, middleName, lastName, phoneNumber, employeeID]
        );
        
        // Update account
        if (password) {
            await connection.query(
                'UPDATE account SET username = ?, role = ?, password = ? WHERE accountID = ?',
                [username, role, password, accountID]
            );
        } else {
            await connection.query(
                'UPDATE account SET username = ?, role = ? WHERE accountID = ?',
                [username, role, accountID]
            );
        }
        
        // Commit transaction
        await connection.commit();
        
        return {
            accountID,
            employeeID,
            firstName,
            middleName,
            lastName,
            phoneNumber,
            username,
            role,
            status: 'Active'
        };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating user:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function deactivateUser(accountID) {
    try {
        const [result] = await pool.query(
            'UPDATE account SET status = ? WHERE accountID = ?',
            ['Inactive', accountID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error deactivating user:', error);
        throw error;
    }
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
        const [rows] = await pool.query('CALL sp_CreateOrder(?, ?, ?)', [accountId, discountPercent, 'cash']);
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

export async function getVariantIdBySize(productId, variantName) {
    try {
        // Get product type first
        const [productRows] = await pool.query(
            'SELECT productType FROM product WHERE productID = ?',
            [productId]
        );
        
        if (!productRows || productRows.length === 0) {
            throw new Error('Product not found');
        }
        
        const productType = productRows[0].productType;
        let variantId = null;
        
        if (productType === 'drink') {
            const [drinkRows] = await pool.query(
                'SELECT drinkID FROM drink WHERE productID = ? AND size = ? LIMIT 1',
                [productId, variantName]
            );
            variantId = drinkRows[0]?.drinkID || null;
        } else if (productType === 'flavoredItem') {
            const [flavorRows] = await pool.query(
                'SELECT flavoredItemID FROM flavoredItem WHERE productID = ? AND flavorName = ? LIMIT 1',
                [productId, variantName]
            );
            variantId = flavorRows[0]?.flavoredItemID || null;
        } else if (productType === 'simpleProduct') {
            const [simpleRows] = await pool.query(
                'SELECT simpleProductID FROM simpleProduct WHERE productID = ? LIMIT 1',
                [productId]
            );
            variantId = simpleRows[0]?.simpleProductID || null;
        }
        
        if (!variantId) {
            throw new Error(`Variant not found for product ${productId} with variant name ${variantName}`);
        }
        
        return variantId;
    } catch (error) {
        console.error('Error getting variant ID by size:', error);
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

export async function finalizeOrder(orderId, paymentMethod) {
    try {
        const query = `UPDATE orders SET paymentMethod = ?, status = 'completed' WHERE orderID = ?`;
        const [result] = await pool.query(query, [paymentMethod, orderId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error finalizing order:', error);
        throw error;
    }
}

export async function updateIngredient(
    ingredientID, 
    ingredientName,
    stockQuantity,
    unit,
    minStockLevel,
    expiryDate
) {
    try {
        const [result] = await pool.query(
            `UPDATE ingredient
            SET ingredientName = ?,
                stockQuantity = ?,
                unit = ?,
                minStockLevel = ?,
                expiryDate = ?
            WHERE ingredientID = ?`,
            [   ingredientName,
                stockQuantity,
                unit,
                minStockLevel,
                expiryDate || null,
                ingredientID,
            ]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error while updating database: ', error);
        throw error;
    }
}

export async function addIngredient(ingredientName, stockQuantity, unit, minStockLevel, expiryDate) {
    try {
        const [result] = await pool.query(
            `INSERT INTO ingredient (ingredientName, stockQuantity, unit, minStockLevel, expiryDate)
            VALUES (?, ?, ?, ?, ?)`,
            [ingredientName, stockQuantity, unit, minStockLevel, expiryDate]
        );
        return result.insertID;
    } catch (error) {
        console.log('Failed to insert ingredient: ', error);
        throw error;
    }
}

export default pool;
