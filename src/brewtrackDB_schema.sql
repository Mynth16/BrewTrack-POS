CREATE DATABASE brewtrackdb;
USE brewtrackdb;

-- EMPLOYEE & ACCOUNT
CREATE TABLE employee (
    employeeID   INT          PRIMARY KEY AUTO_INCREMENT,
    firstName    VARCHAR(50)  NOT NULL,
    middleName   VARCHAR(50),
    lastName     VARCHAR(50)  NOT NULL,
    phoneNumber  VARCHAR(20)
);

CREATE TABLE account (
    accountID   INT          PRIMARY KEY AUTO_INCREMENT,
    employeeID  INT          NOT NULL,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'Active',
    FOREIGN KEY (employeeID) REFERENCES employee(employeeID)
);

-- INGREDIENT & ADD-ON
CREATE TABLE ingredient (
    ingredientID   INT             PRIMARY KEY AUTO_INCREMENT,
    ingredientName VARCHAR(100)    NOT NULL,
    stockQuantity  DECIMAL(10, 2)  NOT NULL DEFAULT 0,
    minStockLevel  DECIMAL(10, 2)  NOT NULL DEFAULT 0,
    unit           VARCHAR(20),
    expiryDate     DATE
);

CREATE TABLE addOn (
    addOnID      INT             PRIMARY KEY AUTO_INCREMENT,
    ingredientID INT             NOT NULL,
    addOnName    VARCHAR(100)    NOT NULL,
    addOnPrice   DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID)
);


-- PRODUCT & SUBTYPES
CREATE TABLE product (
    productID    INT          PRIMARY KEY AUTO_INCREMENT,
    productName  VARCHAR(100) NOT NULL,
    productType  ENUM('simpleProduct', 'drink', 'flavoredItem') NOT NULL,
    category     VARCHAR(50),
    imageURL     VARCHAR(255)
);

-- For plain products with no size or flavor
CREATE TABLE simpleProduct (
    simpleProductID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID        INT             NOT NULL UNIQUE,
    price            DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE
);

-- For drinks that vary by size
CREATE TABLE drink (
    drinkID    INT             PRIMARY KEY AUTO_INCREMENT,
    productID  INT             NOT NULL,
    size       VARCHAR(20)     NOT NULL,
    price      DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    UNIQUE KEY unique_drink_size (productID, size)
);

-- For items that vary by flavor
CREATE TABLE flavoredItem (
    flavoredItemID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID       INT             NOT NULL,
    flavorName      VARCHAR(50)     NOT NULL,
    price           DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    UNIQUE KEY unique_flavored_item (productID, flavorName)
);

-- PRODUCT RECIPES & AVAILABLE ADD-ONS
CREATE TABLE productIngredient (
    productIngredientID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID            INT             NOT NULL,
    ingredientID         INT             NOT NULL,
    quantityRequired     DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID)    REFERENCES product(productID)       ON DELETE CASCADE,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID) ON DELETE CASCADE,
    UNIQUE KEY unique_product_ingredient (productID, ingredientID)
);

CREATE TABLE productAddOn (
    productAddOnID   INT             PRIMARY KEY AUTO_INCREMENT,
    productID        INT             NOT NULL,
    addOnID          INT             NOT NULL,
    quantityRequired DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE,
    FOREIGN KEY (addOnID)   REFERENCES addOn(addOnID)     ON DELETE CASCADE,
    UNIQUE KEY unique_product_addon (productID, addOnID)
);

-- ORDERS
CREATE TABLE orders (
    orderID         INT             PRIMARY KEY AUTO_INCREMENT,
    accountID       INT             NOT NULL,
    dateAndTime     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discountPercent DECIMAL(5, 2)   DEFAULT 0,
    taxAmount       DECIMAL(10, 2)  DEFAULT 0,
    paymentMethod   VARCHAR(20),
    FOREIGN KEY (accountID) REFERENCES account(accountID)
);

CREATE TABLE orderItem (
    orderItemID        INT             PRIMARY KEY AUTO_INCREMENT,
    orderID            INT             NOT NULL,
    productID          INT             NOT NULL,
    productPriceAtTime DECIMAL(10, 2)  NOT NULL,
    lineTotal          DECIMAL(10, 2)  NOT NULL,
    productQuantity    INT             NOT NULL DEFAULT 1,
    FOREIGN KEY (orderID)   REFERENCES orders(orderID)    ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES product(productID)
);

-- Bridge tables: exactly one of these will have a row per orderItem,
-- recording which specific variant (drink size / flavor / simple) was ordered.

CREATE TABLE orderItemDrink (
    orderItemDrinkID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID       INT  NOT NULL UNIQUE,
    drinkID           INT  NOT NULL,
    FOREIGN KEY (orderItemID) REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (drinkID)     REFERENCES drink(drinkID)
);

CREATE TABLE orderItemFlavoredItem (
    orderItemFlavoredItemID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID              INT  NOT NULL UNIQUE,
    flavoredItemID           INT  NOT NULL,
    FOREIGN KEY (orderItemID)    REFERENCES orderItem(orderItemID)          ON DELETE CASCADE,
    FOREIGN KEY (flavoredItemID) REFERENCES flavoredItem(flavoredItemID)
);

CREATE TABLE orderItemSimpleProduct (
    orderItemSimpleProductID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID               INT  NOT NULL UNIQUE,
    simpleProductID           INT  NOT NULL,
    FOREIGN KEY (orderItemID)     REFERENCES orderItem(orderItemID)          ON DELETE CASCADE,
    FOREIGN KEY (simpleProductID) REFERENCES simpleProduct(simpleProductID)
);

-- ORDER ITEM ADD-ONS
CREATE TABLE orderItemAddOn (
    orderItemAddOnID  INT             PRIMARY KEY AUTO_INCREMENT,
    orderItemID       INT             NOT NULL,
    addOnID           INT             NOT NULL,
    addOnPriceAtTime  DECIMAL(10, 2)  NOT NULL,
    addOnQuantity     INT             NOT NULL DEFAULT 1,
    FOREIGN KEY (orderItemID) REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (addOnID)     REFERENCES addOn(addOnID)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_product_type      ON product(productType);
CREATE INDEX idx_product_category  ON product(category);
CREATE INDEX idx_drink_product     ON drink(productID);
CREATE INDEX idx_flavored_product  ON flavoredItem(productID);
CREATE INDEX idx_order_account     ON orders(accountID);
CREATE INDEX idx_order_date        ON orders(dateAndTime);
CREATE INDEX idx_orderitem_order   ON orderItem(orderID);
CREATE INDEX idx_orderitem_product ON orderItem(productID);
