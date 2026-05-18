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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const query = `UPDATE orders SET paymentMethod = ?, status = 'completed' WHERE orderID = ?`;
        const [result] = await pool.query(query, [paymentMethod, orderId]);
        return result.affectedRows > 0;

        if (result.affectedRows === 0) {
            await conn.rollback();
            return false;
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
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

export async function getProductCategories() {
    try {
        const [rows] = await pool.query(
            'SELECT DISTINCT category FROM product'
        );
        return rows.map(row => row.category);
    } catch (error) {
        console.error('Failed to get all distinct categories: ', error);
        throw error;
    }
}

export async function getAllAddOns() {
    try {
        const [rows] = await pool.query(
            'SELECT addOnID, addOnName, addOnPrice FROM addOn'
        );
        return rows;
    } catch (error) {
        console.error('Failed to get add-ons: ', error);
        throw error;
    }
}

export async function addProduct(productName, productType, category, imageURL) {
    try {
        const [result] = await pool.query(
            `INSERT INTO product (productName, productType, category, imageURL)
             VALUES (?, ?, ?, ?)`,
            [productName, productType, category, imageURL || null]
        );
        return result.insertId;
    } catch (error) {
        console.error('Failed to add product: ', error);
        throw error;
    }
}

export async function addSimpleProduct(productID, price) {
    try {
        const [result] = await pool.query(
            `INSERT INTO simpleProduct (productID, price) VALUES (?, ?)`,
            [productID, price]
        );
        return result.insertId;
    } catch (error) {
        console.error('Failed to add simple product: ', error);
        throw error;
    }
}

export async function addProductIngredients(productID, ingredients) {
    try {
        const values = ingredients.map(ing => [productID, ing.ingredientID, ing.quantityRequired]);
        await pool.query(
            `INSERT INTO productIngredient (productID, ingredientID, quantityRequired) VALUES ?`,
            [values]
        );
    } catch (error) {
        console.error('Failed to add product ingredients: ', error);
        throw error;
    }
}

export async function addProductAddOns(productID, addOns) {
    try {
        const values = addOns.map(addOn => [productID, addOn.addOnID, addOn.quantityRequired]);
        await pool.query(
            `INSERT INTO productAddOn (productID, addOnID, quantityRequired) VALUES ?`,
            [values]
        );
    } catch (error) {
        console.error('Failed to add product add-ons: ', error);
        throw error;
    }
}
export async function addDrink(productID, size, price) {
    try {
        const [result] = await pool.query(
            `INSERT INTO drink (productID, size, price) VALUES (?, ?, ?)`,
            [productID, size, price]
        );
        return result.insertId; // returns drinkID
    } catch (error) {
        console.error('Failed to add drink: ', error);
        throw error;
    }
}

export async function addDrinkIngredients(drinkID, ingredients) {
    try {
        const values = ingredients.map(ing => [drinkID, ing.ingredientID, ing.quantityRequired]);
        await pool.query(
            `INSERT INTO drinkIngredient (drinkID, ingredientID, quantityRequired) VALUES ?`,
            [values]
        );
    } catch (error) {
        console.error('Failed to add drink ingredients: ', error);
        throw error;
    }
}

export async function addFlavoredItem(productID, flavorName, price) {
    try {
        const [result] = await pool.query(
            `INSERT INTO flavoredItem (productID, flavorName, price) VALUES (?, ?, ?)`,
            [productID, flavorName, price]
        );
        return result.insertId;
    } catch (error) {
        console.error('Failed to add flavored item: ', error);
        throw error;
    }
}

export async function addFlavoredItemIngredients(flavoredItemID, ingredients) {
    try {
        const values = ingredients.map(ing => [flavoredItemID, ing.ingredientID, ing.quantityRequired]);
        await pool.query(
            `INSERT INTO flavoredItemIngredient (flavoredItemID, ingredientID, quantityRequired) VALUES ?`,
            [values]
        );
    } catch (error) {
        console.error('Failed to add flavored item ingredients: ', error);
        throw error;
    }
}

export async function getProductByID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT productID, productName, productType, category, imageURL FROM product WHERE productID = ?`,
            [productID]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Failed to get product: ', error);
        throw error;
    }
}

export async function getSimpleProductByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT price FROM simpleProduct WHERE productID = ?`,
            [productID]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Failed to get simple product: ', error);
        throw error;
    }
}

export async function getProductIngredientsbyProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT pi.ingredientID, i.ingredientName, pi.quantityRequired
             FROM productIngredient pi
             JOIN ingredient i ON pi.ingredientID = i.ingredientID
             WHERE pi.productID = ?`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get product ingredients: ', error);
        throw error;
    }
}

export async function getProductAddOnsByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT pa.addOnID, a.addOnName, pa.quantityRequired
             FROM productAddOn pa
             JOIN addOn a ON pa.addOnID = a.addOnID
             WHERE pa.productID = ?`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get product add-ons: ', error);
        throw error;
    }
}

export async function getDrinkIngredientsByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT d.drinkID, d.size, d.price, di.ingredientID, i.ingredientName, di.quantityRequired
             FROM drink d
             LEFT JOIN drinkIngredient di ON d.drinkID = di.drinkID
             LEFT JOIN ingredient i ON di.ingredientID = i.ingredientID
             WHERE d.productID = ?
             ORDER BY d.drinkID`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get drink ingredients: ', error);
        throw error;
    }
}

export async function getFlavoredItemIngredientsByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT fi.flavoredItemID, fi.flavorName, fi.price, fii.ingredientID, i.ingredientName, fii.quantityRequired
             FROM flavoredItem fi
             LEFT JOIN flavoredItemIngredient fii ON fi.flavoredItemID = fii.flavoredItemID
             LEFT JOIN ingredient i ON fii.ingredientID = i.ingredientID
             WHERE fi.productID = ?
             ORDER BY fi.flavoredItemID`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get flavored item ingredients: ', error);
        throw error;
    }
}

export async function updateProductBase(productID, productName, category, imageURL) {
    try {
        const [result] = await pool.query(
            `UPDATE product SET productName = ?, category = ?, imageURL = ? WHERE productID = ?`,
            [productName, category, imageURL || null, productID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Failed to update product: ', error);
        throw error;
    }
}

export async function updateSimpleProductPrice(productID, price) {
    try {
        const [result] = await pool.query(
            `UPDATE simpleProduct SET price = ? WHERE productID = ?`,
            [price, productID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Failed to update simple product price: ', error);
        throw error;
    }
}

export async function replaceProductIngredients(productID, ingredients) {
    try {
        await pool.query(`DELETE FROM productIngredient WHERE productID = ?`, [productID]);
        if (ingredients.length > 0) {
            const values = ingredients.map(i => [productID, i.ingredientID, i.quantityRequired]);
            await pool.query(
                `INSERT INTO productIngredient (productID, ingredientID, quantityRequired) VALUES ?`,
                [values]
            );
        }
    } catch (error) {
        console.error('Failed to replace product ingredients: ', error);
        throw error;
    }
}

export async function replaceProductAddOns(productID, addOns) {
    try {
        await pool.query(`DELETE FROM productAddOn WHERE productID = ?`, [productID]);
        if (addOns.length > 0) {
            const values = addOns.map(a => [productID, a.addOnID, a.quantityRequired]);
            await pool.query(
                `INSERT INTO productAddOn (productID, addOnID, quantityRequired) VALUES ?`,
                [values]
            );
        }
    } catch (error) {
        console.error('Failed to replace product add-ons: ', error);
        throw error;
    }
}

export async function replaceDrinkIngredients(drinkID, ingredients) {
    try {
        await pool.query(`DELETE FROM drinkIngredient WHERE drinkID = ?`, [drinkID]);
        if (ingredients.length > 0) {
            const values = ingredients.map(i => [drinkID, i.ingredientID, i.quantityRequired]);
            await pool.query(
                `INSERT INTO drinkIngredient (drinkID, ingredientID, quantityRequired) VALUES ?`,
                [values]
            );
        }
    } catch (error) {
        console.error('Failed to replace drink ingredients: ', error);
        throw error;
    }
}

export async function replaceFlavoredItemIngredients(flavoredItemID, ingredients) {
    try {
        await pool.query(`DELETE FROM flavoredItemIngredient WHERE flavoredItemID = ?`, [flavoredItemID]);
        if (ingredients.length > 0) {
            const values = ingredients.map(i => [flavoredItemID, i.ingredientID, i.quantityRequired]);
            await pool.query(
                `INSERT INTO flavoredItemIngredient (flavoredItemID, ingredientID, quantityRequired) VALUES ?`,
                [values]
            );
        }
    } catch (error) {
        console.error('Failed to replace flavored item ingredients: ', error);
        throw error;
    }
}

export async function getProductIngredientsWithStockByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT pi.quantityRequired, i.stockQuantity
             FROM productIngredient pi
             JOIN ingredient i ON pi.ingredientID = i.ingredientID
             WHERE pi.productID = ?`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get product ingredients with stock: ', error);
        throw error;
    }
}

export async function getDrinkIngredientsWithStockByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT d.drinkID, d.size, di.ingredientID, di.quantityRequired, i.stockQuantity
             FROM drink d
             LEFT JOIN drinkIngredient di ON d.drinkID = di.drinkID
             LEFT JOIN ingredient i ON di.ingredientID = i.ingredientID
             WHERE d.productID = ?
             ORDER BY d.drinkID`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get drink ingredients with stock: ', error);
        throw error;
    }
}

export async function getFlavoredItemIngredientsWithStockByProductID(productID) {
    try {
        const [rows] = await pool.query(
            `SELECT fi.flavoredItemID, fi.flavorName, fii.ingredientID, fii.quantityRequired, i.stockQuantity
             FROM flavoredItem fi
             LEFT JOIN flavoredItemIngredient fii ON fi.flavoredItemID = fii.flavoredItemID
             LEFT JOIN ingredient i ON fii.ingredientID = i.ingredientID
             WHERE fi.productID = ?
             ORDER BY fi.flavoredItemID`,
            [productID]
        );
        return rows;
    } catch (error) {
        console.error('Failed to get flavored item ingredients with stock: ', error);
        throw error;
    }
}

export async function addAddOn(ingredientID, addOnName, addOnPrice) {
    try {
        const [result] = await pool.query(
            'INSERT INTO addOn (ingredientID, addOnName, addOnPrice) VALUES (?, ?, ?)',
            [ingredientID, addOnName, addOnPrice]
        );
        return { addOnID: result.insertId, ingredientID, addOnName, addOnPrice };
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function addRestockTemplate(tempName, description = null, items = []) {
  const [result] = await pool.query(
    'INSERT INTO restockTemplate (tempName, `desc`) VALUES (?, ?)',
    [tempName, description]
  );

  const templateID = result.insertId;

  if (items.length > 0) {
    const values = items.map(item => [templateID, item.ingredientID, item.quantityToAdd]);
    await pool.query(
      'INSERT INTO restockTemplateList (restockTemplateID, ingID, qty) VALUES ?',
      [values]
    );
  }

  return { templateID, templateName: tempName, description, items };
}

export async function getRestockTemplates() {
  const [templates] = await pool.query(
    'SELECT id AS templateID, tempName AS templateName, `desc` AS description FROM restockTemplate ORDER BY id DESC'
  );

  if (!templates.length) return [];

  const templateIds = templates.map(t => t.templateID);
  const [rows] = await pool.query(
    'SELECT id, restockTemplateID, ingID, qty FROM restockTemplateList WHERE restockTemplateID IN (?)',
    [templateIds]
  );

  return templates.map(template => ({
    ...template,
    items: rows
      .filter(row => row.restockTemplateID === template.templateID)
      .map(row => ({
        id: row.id,
        ingredientID: row.ingID,
        quantityToAdd: Number(row.qty),
      }))
  }));
}

export async function getRestockTemplateById(templateID) {
  const [templates] = await pool.query(
    'SELECT id AS templateID, tempName AS templateName, `desc` AS description FROM restockTemplate WHERE id = ?',
    [templateID]
  );
  const template = templates[0];
  if (!template) return null;

  const [rows] = await pool.query(
    'SELECT id, restockTemplateID, ingID, qty FROM restockTemplateList WHERE restockTemplateID = ?',
    [templateID]
  );

  return {
    ...template,
    items: rows.map(row => ({
      id: row.id,
      ingredientID: row.ingID,
      quantityToAdd: Number(row.qty),
    })),
  };
}

export async function updateRestockTemplate(templateID, tempName, description = null, items = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE restockTemplate SET tempName = ?, `desc` = ? WHERE id = ?',
      [tempName, description, templateID]
    );

    await conn.query(
      'DELETE FROM restockTemplateList WHERE restockTemplateID = ?',
      [templateID]
    );

    if (items.length > 0) {
      const values = items.map(item => [templateID, item.ingredientID, item.quantityToAdd]);
      await conn.query(
        'INSERT INTO restockTemplateList (restockTemplateID, ingID, qty) VALUES ?',
        [values]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function deleteRestockTemplate(templateID) {
  await pool.query('DELETE FROM restockTemplate WHERE id = ?', [templateID]);
}

export async function applyRestock(items = []) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('No items provided');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const it of items) {
      await conn.query(
        'UPDATE ingredient SET stockQuantity = stockQuantity + ? WHERE ingredientID = ?',
        [it.quantityAdded, it.ingredientID]
      );
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateDrinkVariant(drinkID, size, price) {
    try {
        const [result] = await pool.query(
            `UPDATE drink SET size = ?, price = ? WHERE drinkID = ?`,
            [size, price, drinkID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Failed to update drink variant:', error);
        throw error;
    }
}

export async function updateFlavoredItemVariant(flavoredItemID, flavorName, price) {
    try {
        const [result] = await pool.query(
            `UPDATE flavoredItem SET flavorName = ?, price = ? WHERE flavoredItemID = ?`,
            [flavorName, price, flavoredItemID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Failed to update flavored item variant:', error);
        throw error;
    }
}

export async function getFilteredOrders(filters) {
    const { startDate, endDate, cashierId, productId } = filters;
    let query = `
        SELECT 
            o.orderID, 
            o.dateAndTime, 
            COALESCE(SUM(oi.lineTotal), 0) as total,
            o.discountPercent,
            CONCAT(e.firstName, ' ', e.lastName) AS cashierName
        FROM orders o
        JOIN account a ON o.accountID = a.accountID
        JOIN employee e ON a.employeeID = e.employeeID
        LEFT JOIN orderItem oi ON o.orderID = oi.orderID
        WHERE 1=1
    `;
    const params = [];

    if (startDate) {
        query += ' AND DATE(o.dateAndTime) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND DATE(o.dateAndTime) <= ?';
        params.push(endDate);
    }
    if (cashierId) {
        query += ' AND a.accountID = ?';
        params.push(cashierId);
    }
    if (productId) {
        query += ' AND o.orderID IN (SELECT orderID FROM orderItem WHERE productID = ?)';
        params.push(productId);
    }

    query += ' GROUP BY o.orderID ORDER BY o.dateAndTime DESC';

    const [orders] = await pool.query(query, params);

    for (const order of orders) {
        const [items] = await pool.query(`
            SELECT 
                oi.orderItemID, 
                oi.productQuantity as quantity, 
                p.productName, 
                p.productID,
                p.productType,
                CASE
                    WHEN p.productType = 'drink' THEN d.size
                    WHEN p.productType = 'flavoredItem' THEN fi.flavorName
                    ELSE NULL
                END AS variant
            FROM orderItem oi
            JOIN product p ON oi.productID = p.productID
            LEFT JOIN orderItemDrink oid ON oi.orderItemID = oid.orderItemID
            LEFT JOIN drink d ON oid.drinkID = d.drinkID
            LEFT JOIN orderItemFlavoredItem oifi ON oi.orderItemID = oifi.orderItemID
            LEFT JOIN flavoredItem fi ON oifi.flavoredItemID = fi.flavoredItemID
            WHERE oi.orderID = ?
        `, [order.orderID]);

        for (const item of items) {
            const [addOns] = await pool.query(`
                SELECT a.addOnName, oiAO.addOnPriceAtTime as price
                FROM orderItemAddOn oiAO
                JOIN addOn a ON oiAO.addOnID = a.addOnID
                WHERE oiAO.orderItemID = ?
            `, [item.orderItemID]);
            item.addOns = addOns;
        }
        order.items = items;
    }

    return orders;
}

export async function getCashiers() {
    try {
        const [rows] = await pool.query(`
            SELECT a.accountID, CONCAT(e.firstName, ' ', e.lastName) AS cashierName
            FROM account a
            JOIN employee e ON a.employeeID = e.employeeID
            WHERE a.role = 'Cashier' AND a.status = 'Active'
            ORDER BY e.lastName, e.firstName
        `);
        return rows;
    } catch (error) {
        console.error('Error fetching cashiers:', error);
        throw error;
    }
}

export async function deactivateProduct(productID) {
    try {
        const [result] = await pool.query(
            `UPDATE product SET isActive = 0 WHERE productID = ?`,
            [productID]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Failed to deactivate product:', error);
        throw error;
    }
}

export default pool;