-- STORED PROCEDURES FOR BREWTRACK POS DATABASE
-- Execute after brewtrackDB_schema.sql
-- These procedures handle core POS operations

USE brewtrackdb;

-- ============================================================
-- 1. sp_CreateOrder
-- ============================================================
-- Creates a complete order with items, variants, and add-ons
-- Returns: orderID via SELECT result set
-- Usage: CALL sp_CreateOrder(accountID, discountPercent, paymentMethod);
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_CreateOrder(
    IN p_accountID INT,
    IN p_discountPercent DECIMAL(5, 2),
    IN p_paymentMethod VARCHAR(20)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_orderID INT;
    DECLARE v_error INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_error = 1;
    
    -- Validate input
    IF p_accountID IS NULL OR p_accountID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid accountID';
    END IF;
    
    IF p_discountPercent IS NULL THEN SET p_discountPercent = 0; END IF;
    IF p_paymentMethod IS NULL THEN SET p_paymentMethod = 'Cash'; END IF;
    
    -- Create order
    INSERT INTO orders (accountID, dateAndTime, discountPercent, paymentMethod, status)
    VALUES (p_accountID, NOW(), p_discountPercent, p_paymentMethod, 'pending');
    
    SET v_orderID = LAST_INSERT_ID();
    
    IF v_error = 0 THEN
        SELECT v_orderID as orderID;
    ELSE
        SELECT NULL as orderID;
    END IF;
END$$

-- ============================================================
-- 2. sp_AddOrderItem
-- ============================================================
-- Adds an item to an order with variant (drink size/flavor/simple)
-- Handles automatic insertion to appropriate bridge table
-- Returns: orderItemID via SELECT result set
-- Usage: CALL sp_AddOrderItem(orderID, productID, variantID, quantity, priceAtTime);
-- ============================================================

CREATE PROCEDURE sp_AddOrderItem(
    IN p_orderID      INT,
    IN p_productID    INT,
    IN p_variantID    INT,
    IN p_quantity     INT,
    IN p_priceAtTime  DECIMAL(10, 2)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_orderItemID   INT;
    DECLARE v_productType   VARCHAR(20);
    DECLARE v_lineTotal     DECIMAL(10, 2);
    DECLARE v_ingredientID  INT;
    DECLARE v_qtyRequired   DECIMAL(10, 2);
    DECLARE v_done          INT DEFAULT 0;

    DECLARE cur_ingredients CURSOR FOR
        SELECT ingredientID, quantityRequired
        FROM productIngredient
        WHERE productID = p_productID;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT NULL as orderItemID;
    END;

    START TRANSACTION;

    -- Validate inputs
    IF p_orderID IS NULL OR p_orderID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid orderID';
    END IF;

    IF p_productID IS NULL OR p_productID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid productID';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid quantity';
    END IF;

    -- Get product type
    SELECT productType INTO v_productType
    FROM product
    WHERE productID = p_productID;

    IF v_productType IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
    END IF;

    -- Calculate line total
    SET v_lineTotal = p_priceAtTime * p_quantity;

    -- Insert order item
    INSERT INTO orderItem (orderID, productID, productPriceAtTime, lineTotal, productQuantity)
    VALUES (p_orderID, p_productID, p_priceAtTime, v_lineTotal, p_quantity);

    SET v_orderItemID = LAST_INSERT_ID();

    -- Insert into appropriate bridge table
    IF v_productType = 'drink' THEN
        INSERT INTO orderItemDrink (orderItemID, drinkID)
        VALUES (v_orderItemID, p_variantID);
    ELSEIF v_productType = 'flavoredItem' THEN
        INSERT INTO orderItemFlavoredItem (orderItemID, flavoredItemID)
        VALUES (v_orderItemID, p_variantID);
    ELSEIF v_productType = 'simpleProduct' THEN
        INSERT INTO orderItemSimpleProduct (orderItemID, simpleProductID)
        VALUES (v_orderItemID, p_variantID);
    END IF;

    -- Deduct ingredient stock
    OPEN cur_ingredients;
    SET v_done = 0;  -- reset before inner loop starts
    ing_loop: LOOP
        FETCH cur_ingredients INTO v_ingredientID, v_qtyRequired;
        IF v_done = 1 THEN LEAVE ing_loop; END IF;

        UPDATE ingredient
        SET stockQuantity = stockQuantity - (v_qtyRequired * p_quantity)
        WHERE ingredientID = v_ingredientID;

    END LOOP ing_loop;
    CLOSE cur_ingredients;

    COMMIT;
    SELECT v_orderItemID as orderItemID;
END$$


-- ============================================================
-- 3. sp_AddOrderItemAddOn
-- ============================================================
-- Adds an add-on to an order item
-- Usage: CALL sp_AddOrderItemAddOn(orderItemID, addOnID, addOnPrice, quantity);
-- ============================================================

CREATE PROCEDURE sp_AddOrderItemAddOn(
    IN p_orderItemID INT,
    IN p_addOnID INT,
    IN p_addOnPrice DECIMAL(10, 2),
    IN p_quantity INT
)
READS SQL DATA
BEGIN
    -- Validate input
    IF p_orderItemID IS NULL OR p_orderItemID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid orderItemID';
    END IF;
    
    IF p_addOnID IS NULL OR p_addOnID <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid addOnID';
    END IF;
    
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        SET p_quantity = 1;
    END IF;
    
    -- Insert add-on
    INSERT INTO orderItemAddOn (orderItemID, addOnID, addOnPriceAtTime, addOnQuantity)
    VALUES (p_orderItemID, p_addOnID, p_addOnPrice, p_quantity);
END$$

-- ============================================================
-- 4. sp_GetProductMenu
-- ============================================================
-- Retrieves complete menu for POS display
-- Returns: all products grouped by category with variant counts
-- Usage: CALL sp_GetProductMenu();
-- ============================================================

CREATE PROCEDURE sp_GetProductMenu()
READS SQL DATA
BEGIN
    SELECT
        p.productID,
        p.productName,
        p.productType,
        p.category,
        p.imageURL,
        CASE
            WHEN p.productType = 'simpleProduct' THEN (SELECT price FROM simpleProduct WHERE productID = p.productID LIMIT 1)
            WHEN p.productType = 'drink' THEN (SELECT MIN(price) FROM drink WHERE productID = p.productID)
            WHEN p.productType = 'flavoredItem' THEN (SELECT MIN(price) FROM flavoredItem WHERE productID = p.productID)
        END AS basePrice,
        CASE
            WHEN p.productType = 'simpleProduct' THEN 1
            WHEN p.productType = 'drink' THEN (SELECT COUNT(*) FROM drink WHERE productID = p.productID)
            WHEN p.productType = 'flavoredItem' THEN (SELECT COUNT(*) FROM flavoredItem WHERE productID = p.productID)
        END AS variantCount
    FROM product p
    ORDER BY p.category, p.productName;
END$$

-- ============================================================
-- 5. sp_GetProductVariants
-- ============================================================
-- Get all variants for a specific product
-- Returns: variant details based on product type
-- Usage: CALL sp_GetProductVariants(productID);
-- ============================================================

CREATE PROCEDURE sp_GetProductVariants(
    IN p_productID INT
)
READS SQL DATA
BEGIN
    DECLARE v_productType VARCHAR(20);
    
    -- Get product type
    SELECT productType INTO v_productType FROM product WHERE productID = p_productID;
    
    IF v_productType IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
    END IF;
    
    -- Return variants based on type
    IF v_productType = 'drink' THEN
        SELECT
            drinkID AS variantID,
            size AS variantName,
            price,
            CONCAT(size, ' - PHP ', price) AS displayLabel
        FROM drink
        WHERE productID = p_productID
        ORDER BY
            CASE size
                WHEN '12oz' THEN 1
                WHEN '16oz' THEN 2
                WHEN '22oz' THEN 3
                ELSE 4
            END;
    ELSEIF v_productType = 'flavoredItem' THEN
        SELECT
            flavoredItemID AS variantID,
            flavorName AS variantName,
            price,
            CONCAT(flavorName, ' - PHP ', price) AS displayLabel
        FROM flavoredItem
        WHERE productID = p_productID
        ORDER BY flavorName;
    ELSEIF v_productType = 'simpleProduct' THEN
        SELECT
            simpleProductID AS variantID,
            'Standard' AS variantName,
            price,
            CONCAT('PHP ', price) AS displayLabel
        FROM simpleProduct
        WHERE productID = p_productID;
    END IF;
END$$

-- ============================================================
-- 6. sp_GetAvailableAddOns
-- ============================================================
-- Get all add-ons available for a product
-- Returns: add-on details with pricing
-- Usage: CALL sp_GetAvailableAddOns(productID);
-- ============================================================

CREATE PROCEDURE sp_GetAvailableAddOns(
    IN p_productID INT
)
READS SQL DATA
BEGIN
    SELECT
        a.addOnID,
        a.addOnName,
        a.addOnPrice,
        i.ingredientName,
        CONCAT(a.addOnName, ' - PHP ', a.addOnPrice) AS displayLabel
    FROM productAddOn pa
    JOIN addOn a ON pa.addOnID = a.addOnID
    LEFT JOIN ingredient i ON a.ingredientID = i.ingredientID
    WHERE pa.productID = p_productID
    ORDER BY a.addOnName;
END$$

-- ============================================================
-- 7. sp_CalculateOrderTotal
-- ============================================================
-- Calculate final order total with discount
-- Returns: subtotal, discount amount, final total
-- Usage: CALL sp_CalculateOrderTotal(orderID);
-- ============================================================

CREATE PROCEDURE sp_CalculateOrderTotal(
    IN p_orderID INT
)
READS SQL DATA
BEGIN
    DECLARE v_subtotal DECIMAL(10, 2);
    DECLARE v_discountPercent DECIMAL(5, 2);
    DECLARE v_discountAmount DECIMAL(10, 2);
    DECLARE v_finalTotal DECIMAL(10, 2);
    
    -- Get order details including add-ons
    SELECT
        COALESCE(SUM(oi.lineTotal + COALESCE((SELECT SUM(oia.addOnPriceAtTime * oia.addOnQuantity) FROM orderItemAddOn oia WHERE oia.orderItemID = oi.orderItemID), 0)), 0),
        COALESCE(o.discountPercent, 0)
    INTO v_subtotal, v_discountPercent
    FROM orders o
    LEFT JOIN orderItem oi ON o.orderID = oi.orderID
    WHERE o.orderID = p_orderID
    GROUP BY o.orderID;
    
    -- Calculate discount and final total
    SET v_discountAmount = ROUND(v_subtotal * (v_discountPercent / 100), 2);
    SET v_finalTotal = v_subtotal - v_discountAmount;
    
    -- Return results
    SELECT
        v_subtotal AS subtotal,
        v_discountPercent AS discountPercent,
        v_discountAmount AS discountAmount,
        v_finalTotal AS finalTotal;
END$$

-- ============================================================
-- 8. sp_AuthenticateUser
-- ============================================================
-- Verify employee login credentials
-- Returns: account details if successful, empty result set if failed
-- Usage: CALL sp_AuthenticateUser(username, password);
-- ============================================================

CREATE PROCEDURE sp_AuthenticateUser(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255)
)
READS SQL DATA
BEGIN
    SELECT
        a.accountID,
        a.username,
        a.role,
        a.status,
        CONCAT(e.firstName, ' ', e.lastName) AS employeeName,
        e.phoneNumber
    FROM account a
    JOIN employee e ON a.employeeID = e.employeeID
    WHERE a.username = p_username
    AND a.password = p_password
    AND a.status = 'Active';
END$$

-- ============================================================
-- 9. sp_GetOrderHistory
-- ============================================================
-- Retrieve complete order details for receipt/history
-- Returns: order with all items, variants, and add-ons
-- Usage: CALL sp_GetOrderHistory(orderID);
-- ============================================================

CREATE PROCEDURE sp_GetOrderHistory(
    IN p_orderID INT
)
READS SQL DATA
BEGIN
    SELECT
        o.orderID,
        o.dateAndTime,
        CONCAT(e.firstName, ' ', e.lastName) AS cashierName,
        o.paymentMethod,
        o.discountPercent,
        p.productName,
        p.productType,
        CASE
            WHEN p.productType = 'drink' THEN d.size
            WHEN p.productType = 'flavoredItem' THEN fi.flavorName
            ELSE 'Standard'
        END AS variant,
        oi.productQuantity AS quantity,
        oi.productPriceAtTime AS unitPrice,
        oi.lineTotal,
        COALESCE(GROUP_CONCAT(CONCAT(ao.addOnName, ' (', oia.addOnQuantity, 'x)') 
                 ORDER BY ao.addOnName SEPARATOR ', '), 'None') AS addOns
    FROM orders o
    JOIN account a ON o.accountID = a.accountID
    JOIN employee e ON a.employeeID = e.employeeID
    JOIN orderItem oi ON o.orderID = oi.orderID
    JOIN product p ON oi.productID = p.productID
    LEFT JOIN orderItemDrink oid ON oi.orderItemID = oid.orderItemID
    LEFT JOIN drink d ON oid.drinkID = d.drinkID
    LEFT JOIN orderItemFlavoredItem oifi ON oi.orderItemID = oifi.orderItemID
    LEFT JOIN flavoredItem fi ON oifi.flavoredItemID = fi.flavoredItemID
    LEFT JOIN orderItemAddOn oia ON oi.orderItemID = oia.orderItemID
    LEFT JOIN addOn ao ON oia.addOnID = ao.addOnID
    WHERE o.orderID = p_orderID
    GROUP BY oi.orderItemID
    ORDER BY oi.orderItemID;
END$$

-- ============================================================
-- 10. sp_GetDailySalesReport
-- ============================================================
-- Generate daily sales summary
-- Returns: revenue metrics by payment method
-- Usage: CALL sp_GetDailySalesReport('2025-03-01');
-- ============================================================

CREATE PROCEDURE sp_GetDailySalesReport(
    IN p_date DATE
)
READS SQL DATA
BEGIN
    SELECT
        DATE(o.dateAndTime) AS orderDate,
        COUNT(DISTINCT o.orderID) AS totalOrders,
        o.paymentMethod,
        COUNT(DISTINCT o.orderID) AS orderCount,
        ROUND(SUM(oi.lineTotal), 2) AS revenue,
        ROUND(AVG(oi.lineTotal), 2) AS avgOrderValue
    FROM orders o
    JOIN orderItem oi ON o.orderID = oi.orderID
    WHERE DATE(o.dateAndTime) = p_date
    GROUP BY DATE(o.dateAndTime), o.paymentMethod
    WITH ROLLUP;
END$$

-- ============================================================
-- 11. sp_SalesByCategory
-- ============================================================
-- Category-level sales performance
-- Returns: sales metrics per product category
-- Usage: CALL sp_SalesByCategory('2025-03-01', '2025-03-31');
-- ============================================================

CREATE PROCEDURE sp_SalesByCategory(
    IN p_startDate DATE,
    IN p_endDate DATE
)
READS SQL DATA
BEGIN
    SELECT
        p.category,
        COUNT(DISTINCT oi.orderItemID) AS itemsSold,
        SUM(oi.productQuantity) AS totalQuantity,
        ROUND(SUM(oi.lineTotal), 2) AS categoryRevenue,
        ROUND(AVG(oi.productPriceAtTime), 2) AS avgItemPrice,
        ROUND(SUM(oi.lineTotal) / COUNT(DISTINCT oi.orderItemID), 2) AS revenuePerItem
    FROM orderItem oi
    JOIN product p ON oi.productID = p.productID
    JOIN orders o ON oi.orderID = o.orderID
    WHERE DATE(o.dateAndTime) BETWEEN p_startDate AND p_endDate
    GROUP BY p.category
    ORDER BY categoryRevenue DESC;
END$$

-- ============================================================
-- 12. sp_GetTopSellingProducts
-- ============================================================
-- Best-selling products ranking
-- Returns: top N products by sales volume/revenue
-- Usage: CALL sp_GetTopSellingProducts(10, '2025-03-01', '2025-03-31');
-- ============================================================

CREATE PROCEDURE sp_GetTopSellingProducts(
    IN p_limit INT,
    IN p_startDate DATE,
    IN p_endDate DATE
)
READS SQL DATA
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = p_limit;
    END IF;
    
    SELECT
        p.productID,
        p.productName,
        p.category,
        COUNT(DISTINCT oi.orderItemID) AS timesSold,
        SUM(oi.productQuantity) AS totalQuantity,
        ROUND(SUM(oi.lineTotal), 2) AS totalRevenue,
        ROUND(AVG(oi.productPriceAtTime), 2) AS avgPrice
    FROM orderItem oi
    JOIN product p ON oi.productID = p.productID
    JOIN orders o ON oi.orderID = o.orderID
    WHERE DATE(o.dateAndTime) BETWEEN p_startDate AND p_endDate
    GROUP BY p.productID, p.productName, p.category
    ORDER BY totalRevenue DESC
    LIMIT v_limit;
END$$

-- ============================================================
-- 12. sp_GetVariantIdBySize
-- ============================================================
-- Get the variant ID (drinkID/flavoredItemID/simpleProductID) from product and size/flavor
-- Returns: variantID, variantName, price for the specified product and size
-- Usage: CALL sp_GetVariantIdBySize(productID, 'size_or_flavor_string');
-- ============================================================

CREATE PROCEDURE sp_GetVariantIdBySize(
    IN p_productID INT,
    IN p_variantName VARCHAR(50),
    OUT p_variantID INT
)
READS SQL DATA
BEGIN
    DECLARE v_productType VARCHAR(20);
    
    -- Get product type
    SELECT productType INTO v_productType
    FROM product
    WHERE productID = p_productID;
    
    IF v_productType IS NULL THEN
        SET p_variantID = NULL;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
    END IF;
    
    -- Get variant ID based on product type
    IF v_productType = 'drink' THEN
        SELECT drinkID INTO p_variantID
        FROM drink
        WHERE productID = p_productID AND size = p_variantName
        LIMIT 1;
    ELSEIF v_productType = 'flavoredItem' THEN
        SELECT flavoredItemID INTO p_variantID
        FROM flavoredItem
        WHERE productID = p_productID AND flavorName = p_variantName
        LIMIT 1;
    ELSEIF v_productType = 'simpleProduct' THEN
        SELECT simpleProductID INTO p_variantID
        FROM simpleProduct
        WHERE productID = p_productID
        LIMIT 1;
    END IF;
    
    IF p_variantID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Variant not found';
    END IF;
END$$

DELIMITER ;
