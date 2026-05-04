CREATE TABLE activity_logs (
    id           INT          PRIMARY KEY AUTO_INCREMENT,
    log_message  VARCHAR(255),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //

CREATE TRIGGER trg_after_ingredient_update
AFTER UPDATE ON ingredient
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (log_message)
    VALUES (CONCAT(
        'Ingredient ID ', OLD.ingredientID,
        ' (', OLD.ingredientName, ')',
        ' stock changed from ', OLD.stockQuantity,
        ' to ', NEW.stockQuantity,
        ' ', OLD.unit
    ));
END //


CREATE TRIGGER trg_after_account_update
AFTER UPDATE ON account
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (log_message)
        VALUES (CONCAT(
            'Account ID ', OLD.accountID,
            ' (', OLD.username, ')',
            ' status changed from "', OLD.status,
            '" to "', NEW.status, '"'
        ));
    END IF;
END //


CREATE TRIGGER trg_after_drink_price_update
AFTER UPDATE ON drink
FOR EACH ROW
BEGIN
    IF OLD.price != NEW.price THEN
        INSERT INTO activity_logs (log_message)
        VALUES (CONCAT(
            'Drink ID ', OLD.drinkID,
            ' (', OLD.size, ')',
            ' price changed from PHP ', OLD.price,
            ' to PHP ', NEW.price
        ));
    END IF;
END //

DELIMITER ;


-- TESTS
UPDATE ingredient
SET stockQuantity = stockQuantity - 5
WHERE ingredientID = 1;

UPDATE account
SET status = 'Inactive'
WHERE accountID = 1;

UPDATE drink
SET price = 99.00
WHERE drinkID = 1;




CREATE TABLE audit_trail (
    auditID       INT           PRIMARY KEY AUTO_INCREMENT,
    tableName     VARCHAR(50)   NOT NULL,
    recordID      INT           NOT NULL,
    fieldChanged  VARCHAR(50)   NOT NULL,
    oldValue      VARCHAR(100),
    newValue      VARCHAR(100),
    changedAt     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$

CREATE TRIGGER trg_ingredient_stock_audit
AFTER UPDATE ON ingredient
FOR EACH ROW
BEGIN
    IF OLD.stockQuantity != NEW.stockQuantity THEN
        INSERT INTO audit_trail (tableName, recordID, fieldChanged, oldValue, newValue)
        VALUES (
            'ingredient',
            OLD.ingredientID,
            'stockQuantity',
            CONCAT(OLD.stockQuantity, ' ', OLD.unit),
            CONCAT(NEW.stockQuantity, ' ', NEW.unit)
        );
    END IF;
END$$

DELIMITER ;


SELECT
    at.auditID,
    at.changedAt                                        AS timeOfChange,
    i.ingredientName,
    i.unit,
    at.oldValue                                         AS stockBefore,
    at.newValue                                         AS stockAfter,
    p.productName                                       AS usedInProduct,
    CONCAT(e.firstName, ' ', e.lastName)                AS processedBy,
    o.orderID
FROM audit_trail at
JOIN ingredient        i   ON at.recordID     = i.ingredientID
                          AND at.tableName    = 'ingredient'
JOIN productIngredient pi  ON pi.ingredientID = i.ingredientID
JOIN product           p   ON pi.productID    = p.productID
JOIN orderItem         oi  ON oi.productID    = p.productID
JOIN orders            o   ON oi.orderID      = o.orderID
JOIN account           a   ON o.accountID     = a.accountID
JOIN employee          e   ON a.employeeID    = e.employeeID
ORDER BY at.changedAt DESC;