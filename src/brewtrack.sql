CREATE DATABASE brewtrackdb;
USE brewtrackdb;

CREATE TABLE employee (
    employeeID INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(50) NOT NULL,
    middleName VARCHAR(50),
    lastName VARCHAR(50) NOT NULL,
    phoneNumber VARCHAR(20)
);

CREATE TABLE account (
    accountID INT PRIMARY KEY AUTO_INCREMENT,
    employeeID INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    FOREIGN KEY (employeeID) REFERENCES employee(employeeID)
);

CREATE TABLE ingredient (
    ingredientID INT PRIMARY KEY AUTO_INCREMENT,
    ingredientName VARCHAR(100) NOT NULL,
    stockQuantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minStockLevel DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20),
    expiryDate DATE
);

CREATE TABLE addOn (
    addOnID INT PRIMARY KEY AUTO_INCREMENT,
    ingredientID INT NOT NULL,
    addOnName VARCHAR(100) NOT NULL,
    addOnPrice DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID)
);

CREATE TABLE product (
    productID INT PRIMARY KEY AUTO_INCREMENT,
    productName VARCHAR(100) NOT NULL,
    productType ENUM('product', 'drink', 'flavoredItem') NOT NULL,
    category VARCHAR(50),
    imageURL VARCHAR(255)
);

CREATE TABLE productVariant (
    variantID INT PRIMARY KEY AUTO_INCREMENT,
    productID INT NOT NULL,
    size VARCHAR(20),
    flavorName VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    -- Ensure drinks have size but not flavor
    CHECK (
        (size IS NOT NULL AND flavorName IS NULL) OR  -- drink
        (size IS NULL AND flavorName IS NOT NULL) OR  -- flavoredItem
        (size IS NULL AND flavorName IS NULL)         -- regular product
    )
);

CREATE TABLE orders (
    orderID INT PRIMARY KEY AUTO_INCREMENT,
    accountID INT NOT NULL,
    dateAndTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discountPercent DECIMAL(5, 2) DEFAULT 0,
    taxAmount DECIMAL(10, 2) DEFAULT 0,
    paymentMethod VARCHAR(20),
    FOREIGN KEY (accountID) REFERENCES account(accountID)
);

CREATE TABLE orderItem (
    orderItemID INT PRIMARY KEY AUTO_INCREMENT,
    orderID INT NOT NULL,
    productID INT NOT NULL,
    productPriceAtTime DECIMAL(10, 2) NOT NULL,
    lineTotal DECIMAL(10, 2) NOT NULL,
    productQuantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (orderID) REFERENCES orders(orderID) ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES product(productID)
);

-- Product-Ingredient relationship (recipe/ingredients needed per product)
CREATE TABLE productIngredient (
    productIngredientID INT PRIMARY KEY AUTO_INCREMENT,
    productID INT NOT NULL,
    ingredientID INT NOT NULL,
    quantityRequired DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID) ON DELETE CASCADE,
    UNIQUE KEY unique_product_ingredient (productID, ingredientID)
);

-- Product-AddOn relationship (which add-ons are available for which products, with quantity)
CREATE TABLE productAddOn (
    productAddOnID INT PRIMARY KEY AUTO_INCREMENT,
    productID INT NOT NULL,
    addOnID INT NOT NULL,
    quantityRequired DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    FOREIGN KEY (addOnID) REFERENCES addOn(addOnID) ON DELETE CASCADE,
    UNIQUE KEY unique_product_addon (productID, addOnID)
);

-- Order Item Add-on (which add-ons were selected for a specific order item)
CREATE TABLE orderItemAddOn (
    orderItemAddOnID INT PRIMARY KEY AUTO_INCREMENT,
    orderItemID INT NOT NULL,
    addOnID INT NOT NULL,
    addOnPriceAtTime DECIMAL(10, 2) NOT NULL,
    addOnQuantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (orderItemID) REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (addOnID) REFERENCES addOn(addOnID)
);

-- INDEXES FOR PERFORMANCE

CREATE INDEX idx_product_type ON product(productType);
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_variant_product ON productVariant(productID);
CREATE INDEX idx_order_account ON orders(accountID);
CREATE INDEX idx_order_date ON orders(dateAndTime);
CREATE INDEX idx_orderitem_order ON orderItem(orderID);
CREATE INDEX idx_orderitem_product ON orderItem(productID);

-- SAMPLE DATA

INSERT INTO employee (employeeID, firstName, middleName, lastName, phoneNumber) VALUES
(1, 'Daiza Janine', 'N/A', 'Fernandez', '09171234567'),
(2, 'Barias', 'N/A', 'Dela Torre', '09181234568'),
(3, 'Jada', 'De Asis', 'Parada', '09191234569');

INSERT INTO account (accountID, employeeID, username, role, password) VALUES
(1, 1, 'janine', 'Manager', 'pass1234'),
(2, 2, 'barias', 'Cashier', 'pass2341'),
(3, 3, 'Jada', 'Cashier', 'pass3412');

INSERT INTO ingredient (ingredientID, ingredientName, stockQuantity, minStockLevel, unit, expiryDate) VALUES
(1, 'Espresso Beans', 5.00, 2.00, 'kg', '2025-06-01'),
(2, 'Fresh Milk', 10.00, 3.00, 'L', '2025-03-20'),
(3, 'Rice', 5.00, 2.00, 'kg', '2025-03-18'),
(4, 'Sugar Syrup', 4.00, 1.00, 'L', '2025-04-15'),
(5, 'Cheese', 5.00, 1.00, 'kg', '2025-11-12');

INSERT INTO addOn (addOnID, ingredientID, addOnName, addOnPrice) VALUES
(1, 4, 'Extra Syrup', 15.00),
(2, 1, 'Espresso Shot', 20.00),
(3, 2, 'Extra Milk', 10.00),
(4, 4, 'Caramel Drizzle', 15.00),
(5, 5, 'Cream Cheese', 10.00);

INSERT INTO product (productID, productName, productType, category, imageURL) VALUES
(1, 'Blueberry', 'flavoredItem', 'Fruit Milk', '/img/blueberry1.jpg'),
(2, 'Blueberry Yogurt', 'product', 'Yogurts', '/img/blueberry2.jpg'),
(3, 'Strawberry Yogurt', 'product', 'Yogurts', '/img/strawberry.jpg'),
(4, 'Caramel Macchiato', 'drink', 'Coffee Frappe', '/img/coffeefrappe.jpg'),
(5, 'Fries', 'flavoredItem', 'Snacks', '/img/fries.jpg');

INSERT INTO productVariant (variantID, productID, size, flavorName, price) VALUES
(1, 1, NULL, 'Original', 120.00),
(2, 1, NULL, 'Sweet', 120.00),
(3, 1, NULL, 'Tart', 125.00);

INSERT INTO productVariant (variantID, productID, size, flavorName, price) VALUES
(4, 2, NULL, NULL, 135.00);

INSERT INTO productVariant (variantID, productID, size, flavorName, price) VALUES
(5, 3, NULL, NULL, 139.00);

-- Caramel Macchiato (drink) - different sizes
INSERT INTO productVariant (variantID, productID, size, flavorName, price) VALUES
(6, 4, 'Small', NULL, 105.00),
(7, 4, 'Medium', NULL, 125.00),
(8, 4, 'Large', NULL, 145.00);

-- Fries (flavoredItem) - different flavors
INSERT INTO productVariant (variantID, productID, size, flavorName, price) VALUES
(9, 5, NULL, 'Plain', 85.00),
(10, 5, NULL, 'Cheese', 95.00),
(11, 5, NULL, 'BBQ', 95.00);

-- PRODUCT-INGREDIENT RELATIONSHIPS
INSERT INTO productIngredient (productIngredientID, productID, ingredientID, quantityRequired) VALUES
(1, 1, 2, 0.1),
(2, 2, 2, 0.2),
(3, 2, 4, 0.15),
(4, 4, 1, 0.2),
(5, 4, 2, 0.1);

-- PRODUCT-ADDON RELATIONSHIPS (with quantityRequired)
INSERT INTO productAddOn (productAddOnID, productID, addOnID, quantityRequired) VALUES
(1, 1, 1, 0.02),
(2, 1, 3, 0.02),
(3, 3, 3, 0.10),
(4, 3, 1, 0.02),
(5, 4, 2, 0.10);

INSERT INTO orders (orderID, accountID, dateAndTime, discountPercent, taxAmount, paymentMethod) VALUES
(1, 2, '2025-03-01 09:24:12', 0.00, 5.00, 'Cash'),
(2, 2, '2025-03-01 10:38:26', 10.00, 5.00, 'Credit Card'),
(3, 3, '2025-03-02 11:15:00', 0.00, 5.00, 'Cash'),
(4, 3, '2025-03-02 14:02:44', 5.00, 5.00, 'Credit Card'),
(5, 1, '2025-03-03 08:55:30', 0.00, 5.00, 'Cash');

INSERT INTO orderItem (orderItemID, orderID, productID, productPriceAtTime, lineTotal, productQuantity) VALUES
(1, 1, 1, 120.00, 120.00, 1),
(2, 1, 2, 135.00, 135.00, 1),
(3, 2, 4, 125.00, 250.00, 2),
(4, 3, 5, 85.00, 85.00, 1),
(5, 4, 1, 120.00, 240.00, 2);

-- ORDER ITEM ADD-ONS (with addOnPriceAtTime and addOnQuantity)
INSERT INTO orderItemAddOn (orderItemAddOnID, orderItemID, addOnID, addOnPriceAtTime, addOnQuantity) VALUES
(1, 1, 1, 15.00, 1),
(2, 1, 2, 20.00, 1),
(3, 3, 3, 10.00, 1),
(4, 5, 1, 15.00, 2),
(5, 5, 2, 20.00, 1);

-- VERIFICATION QUERIES

-- Check all products with their variant counts
SELECT 
    p.productID,
    p.productName,
    p.productType,
    p.category,
    COUNT(pv.variantID) as variant_count
FROM product p
LEFT JOIN productVariant pv ON p.productID = pv.productID
GROUP BY p.productID, p.productName, p.productType, p.category
ORDER BY p.productType, p.productName;

-- Check drinks with sizes
SELECT 
    p.productName,
    pv.size,
    pv.price
FROM product p
JOIN productVariant pv ON p.productID = pv.productID
WHERE p.productType = 'drink'
ORDER BY p.productName, pv.size;

-- Check flavored items with flavors
SELECT 
    p.productName,
    pv.flavorName,
    pv.price
FROM product p
JOIN productVariant pv ON p.productID = pv.productID
WHERE p.productType = 'flavoredItem'
ORDER BY p.productName, pv.flavorName;

-- Check regular products (should have 1 variant each)
SELECT 
    p.productName,
    pv.price
FROM product p
JOIN productVariant pv ON p.productID = pv.productID
WHERE p.productType = 'product'
ORDER BY p.productName;

-- View order details with products
SELECT 
    o.orderID,
    o.dateAndTime,
    o.paymentMethod,
    p.productName,
    oi.productQuantity,
    oi.lineTotal
FROM orders o
JOIN orderItem oi ON o.orderID = oi.orderID
JOIN product p ON oi.productID = p.productID
ORDER BY o.orderID, oi.orderItemID;

-- View order items with their add-ons
SELECT 
    oi.orderItemID,
    p.productName,
    a.addOnName,
    oia.addOnPriceAtTime,
    oia.addOnQuantity
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
LEFT JOIN orderItemAddOn oia ON oi.orderItemID = oia.orderItemID
LEFT JOIN addOn a ON oia.addOnID = a.addOnID
ORDER BY oi.orderItemID;

-- View products with available add-ons
SELECT 
    p.productName,
    a.addOnName,
    pa.quantityRequired,
    a.addOnPrice
FROM product p
JOIN productAddOn pa ON p.productID = pa.productID
JOIN addOn a ON pa.addOnID = a.addOnID
ORDER BY p.productName, a.addOnName;