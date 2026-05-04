-- STORED PROCEDURES USAGE GUIDE
-- Example calls for all procedures in brewtrackDB_procedures.sql

-- EXAMPLE 1: Complete Order Creation Flow
-- This demonstrates the POS checkout process

-- Step 1: Create order header
CALL sp_CreateOrder(
    2,           -- accountID (cashier: Barias)
    0,           -- discountPercent
    0,           -- taxAmount
    'Cash',      -- paymentMethod
    @orderID
);

SELECT CONCAT('New Order ID: ', @orderID) AS result;

-- Step 2: Add first item - Caramel Macchiato Large
CALL sp_AddOrderItem(
    @orderID,    -- orderID (from step 1)
    62,          -- productID (Caramel Macchiato)
    61,          -- variantID (drinkID for 22oz size)
    1,           -- quantity
    145.00,      -- priceAtTime
    @orderItemID
);

SELECT CONCAT('Added item. OrderItemID: ', @orderItemID) AS result;

-- Step 3: Add add-on to the drink
CALL sp_AddOrderItemAddOn(
    @orderItemID,  -- orderItemID from step 2
    6,             -- addOnID (Cream Cheese)
    10.00,         -- addOnPrice
    1              -- quantity
);

-- Step 4: Add another item - Plain Waffle
CALL sp_AddOrderItem(
    @orderID,
    21,          -- productID (Plain Waffle)
    19,          -- variantID (simpleProductID)
    2,           -- quantity (2 waffles)
    70.00,       -- priceAtTime
    @orderItemID2
);

-- Step 5: Add add-ons to waffle
CALL sp_AddOrderItemAddOn(@orderItemID2, 1, 25.00, 1);  -- Whipped Cream
CALL sp_AddOrderItemAddOn(@orderItemID2, 5, 25.00, 1);  -- Fruits Jam

-- Step 6: Calculate final total and display
CALL sp_CalculateOrderTotal(@orderID);

-- Step 7: Get complete order history (for receipt)
CALL sp_GetOrderHistory(@orderID);



-- EXAMPLE 2: POS Menu Display
-- For initial menu loading on POS screen

CALL sp_GetProductMenu();
-- Result: All products by category with base price and variant count



-- EXAMPLE 3: Dynamic Variant Selection
-- When customer selects "Caramel Macchiato" (productID 62)

-- Customer sees available sizes:
CALL sp_GetProductVariants(62);
-- Result: drinkID, size, price, displayLabel
-- Output:
--   variantID | variantName | price | displayLabel
--   59        | 12oz        | 115   | 12oz - PHP 115
--   60        | 16oz        | 130   | 16oz - PHP 130
--   61        | 22oz        | 145   | 22oz - PHP 145



-- EXAMPLE 4: Add-Ons Display
-- Show available add-ons for selected product

CALL sp_GetAvailableAddOns(62);  -- For Caramel Macchiato
-- Result: All add-ons: cream cheese, black pearl, nata, popping boba, espresso

CALL sp_GetAvailableAddOns(21);  -- For Plain Waffle
-- Result: All add-ons: whipped cream, drizzle, mallows, crushed oreo, fruits jam



-- EXAMPLE 5: Employee Login
-- Authenticate cashier at POS startup

CALL sp_AuthenticateUser('barias', 'pass2341');
-- Result: accountID=2, username=barias, role=Cashier, status=Active, employeeName=Barias DelaToffe

-- If login fails (returns empty result set):
CALL sp_AuthenticateUser('barias', 'wrongpassword');
-- Result: (empty - no rows returned)



-- EXAMPLE 6: Daily Sales Report
-- Manager checks sales performance

CALL sp_GetDailySalesReport('2025-03-01');
-- Result: Total orders, revenue by payment method, average order value

-- Expected output:
--   orderDate      | totalOrders | paymentMethod | orderCount | revenue | avgOrderValue
--   2025-03-01     | 5           | Cash          | 3          | 900.00  | 300.00
--   2025-03-01     | 5           | GCash         | 2          | 800.00  | 400.00
--   2025-03-01     | 5           | NULL          | 5          | 1700.00 | 340.00



-- EXAMPLE 7: Category Sales Analysis
-- Understand which categories drive revenue

CALL sp_SalesByCategory('2025-03-01', '2025-03-31');
-- Result: Revenue per category for the month
-- Shows: Snacks, Waffles, Coffee, Milk Tea, etc. ranked by revenue



-- EXAMPLE 8: Top Selling Products
-- Identify best sellers for inventory planning

-- Get top 10 products in March 2025
CALL sp_GetTopSellingProducts(10, '2025-03-01', '2025-03-31');
-- Result: ProductName, timesSold, totalQuantity, totalRevenue sorted by revenue

-- Get top 5 for the past week
CALL sp_GetTopSellingProducts(5, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());


-- INTEGRATION EXAMPLES (For Application Code)

-- JavaScript Example:
/*
async function createAndDisplayOrder(cashierID, items, discount, payment) {
    try {
        // 1. Create order
        const [orderResult] = await db.query('CALL sp_CreateOrder(?, ?, ?, ?, @orderID)', 
            [cashierID, discount, 0, payment]);
        const orderID = orderResult[0][0].orderID;
        
        // 2. For each item in cart:
        for (let item of items) {
            const [itemResult] = await db.query('CALL sp_AddOrderItem(?, ?, ?, ?, ?, @itemID)',
                [orderID, item.productID, item.variantID, item.qty, item.price]);
            
            // 3. Add any add-ons to this item:
            for (let addon of item.addOns) {
                await db.query('CALL sp_AddOrderItemAddOn(?, ?, ?, ?)',
                    [itemResult[0][0].orderItemID, addon.id, addon.price, addon.qty]);
            }
        }
        
        // 4. Get final total
        const [totals] = await db.query('CALL sp_CalculateOrderTotal(?)', [orderID]);
        console.log('Final Total: ', totals[0][0].finalTotal);
        
        // 5. Get receipt details
        const [receipt] = await db.query('CALL sp_GetOrderHistory(?)', [orderID]);
        printReceipt(receipt[0]);
        
    } catch (error) {
        console.error('Order error: ', error);
    }
}
*/

-- COMMON USE CASES

-- USE CASE 1: POS STARTUP - Load Menu
-- Call this once when POS app loads:
CALL sp_GetProductMenu();
-- Cache results in app memory for instant category/item selection

-- USE CASE 2: LOGIN - Verify Employee
-- Call when employee logs in:
CALL sp_AuthenticateUser('username', 'password');
-- If result is empty, show "Invalid credentials. Try again."
-- If result has data, store @accountID and @role in session

-- USE CASE 3: ORDER FLOW
-- 1. Customer selects product → get variants
CALL sp_GetProductVariants(productID);
-- 2. Customer selects variant → get add-ons
CALL sp_GetAvailableAddOns(productID);
-- 3. Customer completes order → create order + items + add-ons
CALL sp_CreateOrder(...);
CALL sp_AddOrderItem(...);
CALL sp_AddOrderItemAddOn(...);
-- 4. At checkout → show total
CALL sp_CalculateOrderTotal(orderID);
-- 5. Print receipt
CALL sp_GetOrderHistory(orderID);

-- USE CASE 4: MANAGER DASHBOARD - Daily Overview
-- Morning report:
CALL sp_GetDailySalesReport('2025-03-01');
-- Weekly category analysis:
CALL sp_SalesByCategory('2025-02-25', '2025-03-03');
-- Top products for reordering:
CALL sp_GetTopSellingProducts(15, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());


-- ERROR HANDLING EXAMPLES

-- All procedures validate inputs. Examples:
-- Invalid orderID: CALL sp_GetOrderHistory(0); 
--   → Result: Empty set (no rows)
--
-- Invalid product: CALL sp_GetProductVariants(99999); 
--   → Error: "Product not found"
--
-- Failed login: CALL sp_AuthenticateUser('user', 'wrong');
--   → Result: Empty set (no rows)
--
-- Application should check:
-- - IF procedure returns empty set for lookups (failed auth, invalid ID)
-- - CATCH any exceptions from validation errors