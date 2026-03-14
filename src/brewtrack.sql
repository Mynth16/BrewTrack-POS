CREATE DATABASE brewtrackdb;
USE brewtrackdb;

CREATE TABLE employee (
    employeeID   INT          PRIMARY KEY,
    firstName    VARCHAR(50)  NOT NULL,
    middleName   VARCHAR(50),
    lastName     VARCHAR(50)  NOT NULL,
    phoneNumber  VARCHAR(20)  NOT NULL
);

CREATE TABLE account (
    accountID   INT           PRIMARY KEY,
    employeeID  INT           NOT NULL,
    username    VARCHAR(50)   NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        ENUM('Manager', 'Cashier') NOT NULL,
    FOREIGN KEY (employeeID) REFERENCES employee(employeeID)
);

CREATE TABLE product (
    productID    INT           PRIMARY KEY,
    productName  VARCHAR(100)  NOT NULL,
    category     ENUM('Fruit Milk', 'Yogurts', 'Fruit Tea', 'Soda Pops', 'Coffee Frappe', 'Snacks') NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    imageURL     VARCHAR(255),
    size         VARCHAR(20),
    flavorName   VARCHAR(50)
);

CREATE TABLE ingredient (
    ingredientID    INT           PRIMARY KEY,
    ingredientName  VARCHAR(100)  NOT NULL,
    stockQuantity   DECIMAL(10,2) NOT NULL,
    minStockLevel   DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(20)   NOT NULL,
    expiryDate      DATE
);

CREATE TABLE addon (
    addonID      INT           PRIMARY KEY,
    ingredientID INT           NOT NULL,
    addonName    VARCHAR(100)  NOT NULL,
    addonPrice   DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID)
);

CREATE TABLE productingredient (
    productIngredientID  INT           PRIMARY KEY,
    productID            INT           NOT NULL,
    ingredientID         INT           NOT NULL,
    quantityRequired     DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (productID)    REFERENCES product(productID),
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID)
);

CREATE TABLE productaddon (
    productAddonID   INT           PRIMARY KEY,
    productID        INT           NOT NULL,
    addonID          INT           NOT NULL,
    quantityRequired DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID),
    FOREIGN KEY (addonID)   REFERENCES addon(addonID)
);

CREATE TABLE orders (
    orderID         INT           PRIMARY KEY,
    accountID       INT           NOT NULL,
    dateAndTime     DATETIME      NOT NULL,
    discountPercent DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    taxAmount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paymentMethod   ENUM('Cash', 'Credit Card', 'Scanner') NOT NULL,
    FOREIGN KEY (accountID) REFERENCES account(accountID)
);

CREATE TABLE orderitem (
    orderItemID        INT           PRIMARY KEY,
    orderID            INT           NOT NULL,
    productID          INT           NOT NULL,
    productPriceAtTime DECIMAL(10,2) NOT NULL,
    lineTotal          DECIMAL(10,2) NOT NULL,
    productQuantity    INT           NOT NULL,
    FOREIGN KEY (orderID)    REFERENCES orders(orderID),
    FOREIGN KEY (productID)  REFERENCES product(productID)
);

CREATE TABLE orderitemaddon (
    orderItemAddonID  INT           PRIMARY KEY,
    orderItemID       INT           NOT NULL,
    addonID           INT           NOT NULL,
    addonPriceAtTime  DECIMAL(10,2) NOT NULL,
    addonQuantity     INT           NOT NULL,
    FOREIGN KEY (orderItemID) REFERENCES orderitem(orderItemID),
    FOREIGN KEY (addonID)     REFERENCES addon(addonID)
);

-- SAMPLE DATA

INSERT INTO employee (employeeID, firstName, middleName, lastName, phoneNumber) VALUES
(1, 'Daiza Janine',  'N/A', 'Fernandez', '09171234567'),
(2, 'Barias', 'N/A',  'Dela Torre',    '09281234567'),
(3, 'Jada', 'De Asis',    'Parada',  '09391234567');

INSERT INTO account (accountID, employeeID, username, password, role) VALUES
(1, 1, 'janine', 'pass1234', 'Manager'),
(2, 2, 'barias',   'pass4321', 'Cashier'),
(3, 3, 'jada', 'pass1233', 'Cashier');

INSERT INTO product (productID, productName, category, price, imageURL, size, flavorName) VALUES
(1, 'Blueberry',   'Fruit Milk',   120.00, '/img/blueberry1.jpg',   'Medium', NULL),
(2, 'Blueberry',       'Yogurts',    135.00, '/img/blueberry2.jpg',        NULL,    NULL),
(3, 'Strawberry', 'Yogurts',    139.00, '/img/strawberry.jpg',   NULL,    NULL),
(4, 'Caramel Macchiato',   'Coffee Frappe',   125.00, '/img/coffeefrappe.jpg',    'Large',  NULL),
(5, 'Fries',       'Snacks',    85.00, '/img/fries.jpg',        NULL,    'Cheese');

INSERT INTO ingredient (ingredientID, ingredientName, stockQuantity, minStockLevel, unit, expiryDate) VALUES
(1, 'Espresso Beans', 5.00,  2.00, 'kg', '2025-06-01'),
(2, 'Fresh Milk',    10.00,  3.00, 'L',  '2025-03-20'),
(3, 'Rice',     5.00,  2.00, 'kg', '2025-03-18'),
(4, 'Sugar Syrup',    4.00,  1.00, 'L',  '2025-04-15'),
(5, 'Cheese', 5.00, 1.00, 'kg', '2025-11-12');

INSERT INTO addon (addonID, ingredientID, addonName, addonPrice) VALUES
(1, 4, 'Extra Syrup',     15.00),
(2, 1, 'Espresso Shot',      20.00),
(3, 2, 'Extra Milk',      10.00),
(4, 4, 'Caramel Drizzle', 15.00),
(5, 5, 'Cream Cheese',    10.00);

INSERT INTO productingredient (productIngredientID, productID, ingredientID, quantityRequired) VALUES
(1, 1, 2, 0.1),
(2, 2, 2, 0.2),
(3, 2, 4, 0.15),
(4, 4, 1, 0.2),
(5, 4, 2, 0.1);

INSERT INTO productaddon (productAddonID, productID, addonID, quantityRequired) VALUES
(1, 1, 1, 0.02),
(2, 1, 3, 0.02),
(3, 3, 3, 0.10),
(4, 3, 1, 0.02),
(5, 4, 2, 0.10);

INSERT INTO orders (orderID, accountID, dateAndTime, discountPercent, taxAmount, paymentMethod) VALUES
(1, 2, '2025-03-01 09:24:12',  0.00, 5.00, 'Cash'),
(2, 2, '2025-03-01 10:38:26', 10.00, 5.00, 'Credit Card'),
(3, 3, '2025-03-02 11:15:00',  0.00, 5.00, 'Cash'),
(4, 3, '2025-03-02 14:02:44',  5.00, 5.00, 'Credit Card'),
(5, 1, '2025-03-03 08:55:30',  0.00, 5.00, 'Cash');

INSERT INTO orderitem (orderItemID, orderID, productID, productPriceAtTime, lineTotal, productQuantity) VALUES
(1, 1, 1, 120.00, 120.00, 1),
(2, 1, 2, 135.00, 135.00, 1),
(3, 2, 4, 125.00, 250.00, 2),
(4, 3, 5,  85.00,  85.00, 1),
(5, 4, 1, 120.00, 240.00, 2);

INSERT INTO orderitemaddon (orderItemAddonID, orderItemID, addonID, addonPriceAtTime, addonQuantity) VALUES
(1, 1, 1, 15.00, 1),
(2, 1, 2, 20.00, 1),
(3, 3, 3, 10.00, 1),
(4, 5, 1, 15.00, 2),
(5, 5, 2, 20.00, 1);