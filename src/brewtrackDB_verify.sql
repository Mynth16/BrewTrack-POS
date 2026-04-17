-- VERIFICATION QUERIES FOR BREWTRACK POS DATABASE
-- Execute after brewtrackDB_schema.sql and brewtrackDB_data.sql

-- BASIC PRODUCT OVERVIEW

-- All products with their subtype details
SELECT
    p.productID,
    p.productName,
    p.productType,
    p.category,
    COALESCE(sp.price, d.price, fi.price) AS price,
    d.size,
    fi.flavorName
FROM product p
LEFT JOIN simpleProduct sp ON p.productID = sp.productID
LEFT JOIN drink         d  ON p.productID = d.productID
LEFT JOIN flavoredItem  fi ON p.productID = fi.productID
ORDER BY p.productType, p.productName;

-- Count by product type
SELECT productType, COUNT(*) AS total
FROM product
GROUP BY productType;

-- All simple products with prices
SELECT p.productName, p.category, sp.price
FROM product p
JOIN simpleProduct sp ON p.productID = sp.productID
ORDER BY p.category, p.productName;

-- All drinks with sizes and prices
SELECT p.productName, p.category, d.size, d.price
FROM product p
JOIN drink d ON p.productID = d.productID
ORDER BY p.category, p.productName, d.size;

-- All flavored items with flavors
SELECT p.productName, fi.flavorName, fi.price
FROM product p
JOIN flavoredItem fi ON p.productID = fi.productID
ORDER BY p.productName, fi.flavorName;


-- ADD-ONS VERIFICATION

-- All add-ons available per product
SELECT p.productName, p.category, a.addOnName, a.addOnPrice
FROM product p
JOIN productAddOn pa ON p.productID = pa.productID
JOIN addOn a         ON pa.addOnID = a.addOnID
ORDER BY p.category, p.productName, a.addOnName;

-- Add-on availability summary
SELECT
    COUNT(DISTINCT p.productID) AS productsWithAddOns,
    COUNT(DISTINCT a.addOnID) AS uniqueAddOns,
    COUNT(*) AS totalProductAddOnMappings
FROM productAddOn pa
JOIN product p ON pa.productID = p.productID
JOIN addOn a   ON pa.addOnID = a.addOnID;


-- ORDER DATA VERIFICATION

-- Order summary with subtotals and totals after discount
SELECT
    o.orderID,
    o.dateAndTime,
    a.username,
    o.paymentMethod,
    o.discountPercent,
    SUM(oi.lineTotal)                                              AS subtotal,
    ROUND(SUM(oi.lineTotal) * (1 - o.discountPercent / 100), 2)  AS totalAfterDiscount,
    COUNT(oi.orderItemID)                                          AS itemCount
FROM orders o
JOIN account   a  ON o.accountID = a.accountID
JOIN orderItem oi ON o.orderID   = oi.orderID
GROUP BY o.orderID, o.dateAndTime, a.username, o.paymentMethod, o.discountPercent
ORDER BY o.orderID;

-- Full order detail: product, variant, quantity, price, add-ons
SELECT
    o.orderID,
    p.productName,
    p.productType,
    CASE
        WHEN p.productType = 'drink'        THEN d.size
        WHEN p.productType = 'flavoredItem' THEN fi.flavorName
        ELSE 'N/A'
    END                                                                           AS variantDetail,
    oi.productQuantity,
    oi.productPriceAtTime,
    oi.lineTotal,
    COALESCE(GROUP_CONCAT(ao.addOnName ORDER BY ao.addOnName SEPARATOR ', '), 'None') AS addOns
FROM orders o
JOIN orderItem              oi   ON o.orderID           = oi.orderID
JOIN product                p    ON oi.productID         = p.productID
LEFT JOIN orderItemDrink    oid  ON oi.orderItemID       = oid.orderItemID
LEFT JOIN drink             d    ON oid.drinkID          = d.drinkID
LEFT JOIN orderItemFlavoredItem oifi ON oi.orderItemID   = oifi.orderItemID
LEFT JOIN flavoredItem      fi   ON oifi.flavoredItemID  = fi.flavoredItemID
LEFT JOIN orderItemAddOn    oia  ON oi.orderItemID       = oia.orderItemID
LEFT JOIN addOn             ao   ON oia.addOnID          = ao.addOnID
GROUP BY
    o.orderID, p.productName, p.productType, variantDetail,
    oi.orderItemID, oi.productQuantity, oi.productPriceAtTime, oi.lineTotal
ORDER BY o.orderID, oi.orderItemID;

-- Order items with add-ons
SELECT
    oi.orderItemID,
    p.productName,
    a.addOnName,
    oia.addOnPriceAtTime,
    oia.addOnQuantity
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
LEFT JOIN orderItemAddOn oia ON oi.orderItemID = oia.orderItemID
LEFT JOIN addOn a            ON oia.addOnID = a.addOnID
ORDER BY oi.orderItemID;


-- EMPLOYEE VERIFICATION

-- All employees and their accounts
SELECT
    e.employeeID,
    CONCAT(e.firstName, ' ', e.lastName) AS employeeName,
    a.username,
    a.role,
    a.status,
    e.phoneNumber
FROM employee e
LEFT JOIN account a ON e.employeeID = a.employeeID
ORDER BY e.employeeID;


-- PRODUCT INVENTORY

-- Count of products by category
SELECT
    p.category,
    p.productType,
    COUNT(*) AS count
FROM product p
GROUP BY p.category, p.productType
ORDER BY p.category, p.productType;

-- Count of variants per product
SELECT
    p.productID,
    p.productName,
    p.productType,
    CASE
        WHEN p.productType = 'simpleProduct' THEN (SELECT COUNT(*) FROM simpleProduct WHERE productID = p.productID)
        WHEN p.productType = 'drink' THEN (SELECT COUNT(*) FROM drink WHERE productID = p.productID)
        WHEN p.productType = 'flavoredItem' THEN (SELECT COUNT(*) FROM flavoredItem WHERE productID = p.productID)
    END AS variantCount
FROM product p
ORDER BY p.productType, p.productName;


-- INGREDIENT VERIFICATION

-- Count of ingredients per product
SELECT
    p.productName,
    p.category,
    COUNT(pi.ingredientID) AS ingredientCount
FROM product p
JOIN productIngredient pi ON p.productID = pi.productID
GROUP BY p.productID, p.productName, p.category
ORDER BY p.category, p.productName;

-- Products with NO ingredient mappings (should be empty)
SELECT p.productID, p.productName, p.category
FROM product p
LEFT JOIN productIngredient pi ON p.productID = pi.productID
WHERE pi.productID IS NULL;

-- Full ingredient list per product
SELECT
    p.productName,
    p.category,
    i.ingredientName,
    pi.quantityRequired,
    i.unit
FROM productIngredient pi
JOIN product    p ON pi.productID    = p.productID
JOIN ingredient i ON pi.ingredientID = i.ingredientID
ORDER BY p.category, p.productName, i.ingredientName;

-- Ingredient usage across all products (most used ingredients)
SELECT
    i.ingredientName,
    i.unit,
    COUNT(pi.productID) AS usedInProducts,
    SUM(pi.quantityRequired) AS totalPerFullMenu
FROM ingredient i
JOIN productIngredient pi ON i.ingredientID = pi.ingredientID
GROUP BY i.ingredientID, i.ingredientName, i.unit
ORDER BY usedInProducts DESC;


-- DATA INTEGRITY CHECKS

-- Check for orphaned orderItems (items without variant mapping)
SELECT
    oi.orderItemID,
    oi.orderID,
    oi.productID,
    p.productType
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
LEFT JOIN orderItemDrink oid ON oi.orderItemID = oid.orderItemID
LEFT JOIN orderItemFlavoredItem oifi ON oi.orderItemID = oifi.orderItemID
LEFT JOIN orderItemSimpleProduct oisp ON oi.orderItemID = oisp.orderItemID
WHERE
    (p.productType = 'drink' AND oid.orderItemID IS NULL) OR
    (p.productType = 'flavoredItem' AND oifi.orderItemID IS NULL) OR
    (p.productType = 'simpleProduct' AND oisp.orderItemID IS NULL);

-- Total revenue by payment method
SELECT
    o.paymentMethod,
    COUNT(o.orderID) AS orderCount,
    SUM(SUM(oi.lineTotal)) OVER (PARTITION BY o.paymentMethod) AS totalRevenue
FROM orders o
JOIN orderItem oi ON o.orderID = oi.orderID
GROUP BY o.paymentMethod, o.orderID
ORDER BY o.paymentMethod;

-- Revenue by category
SELECT
    p.category,
    COUNT(oi.orderItemID) AS itemsSold,
    SUM(oi.lineTotal) AS categoryRevenue
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
GROUP BY p.category
ORDER BY categoryRevenue DESC;


-- SUMMARY STATISTICS

-- Overall order and product statistics
SELECT
    (SELECT COUNT(*) FROM orders) AS totalOrders,
    (SELECT COUNT(*) FROM orderItem) AS totalOrderItems,
    (SELECT COUNT(*) FROM product) AS totalProducts,
    (SELECT COUNT(*) FROM addOn) AS totalAddOns,
    (SELECT COUNT(*) FROM employee) AS totalEmployees,
    (SELECT COUNT(*) FROM ingredient) AS totalIngredients,
    ROUND((SELECT SUM(lineTotal) FROM orderItem), 2) AS totalRevenue;

-- Orders per cashier
SELECT
    a.username,
    a.role,
    COUNT(o.orderID) AS orderCount,
    ROUND(SUM(oi.lineTotal), 2) AS totalRevenue
FROM account a
LEFT JOIN orders o ON a.accountID = o.accountID
LEFT JOIN orderItem oi ON o.orderID = oi.orderID
WHERE a.role = 'Cashier'
GROUP BY a.accountID, a.username, a.role
ORDER BY orderCount DESC;

-- Popular products (most ordered)
SELECT
    p.productName,
    p.category,
    COUNT(oi.orderItemID) AS timesSold,
    SUM(oi.productQuantity) AS totalQuantity,
    ROUND(SUM(oi.lineTotal), 2) AS totalRevenue
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
GROUP BY oi.productID, p.productName, p.category
ORDER BY timesSold DESC
LIMIT 20;
