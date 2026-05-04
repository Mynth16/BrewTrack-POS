# BrewTrack POS Database - SQL Files Guide

**Database:** `brewtrackdb` | **Purpose:** Real-time POS + Sales Analytics

## SQL Files Overview

### 1. `brewtrackDB_schema.sql`
**Creates:** 17 tables + 11 indexes

**Key Tables:**
- `employee`, `account` - User authentication (Manager/Cashier roles)
- `ingredient`, `addOn`, `productAddOn` - Inventory & premium add-ons
- `product`, `simpleProduct`, `drink`, `flavoredItem` - 3-type product catalog (76 products)
- `productIngredient` - Product recipes for auto stock deduction
- `orders`, `orderItem` - Transaction headers & line items
- `orderItemDrink`, `orderItemFlavoredItem`, `orderItemSimpleProduct` - Bridge tables (one per order item)
- `orderItemAddOn` - Premium add-ons per order item
- `audit_trail`, `activity_logs` - Compliance tracking

**Important Notes:**
- 3 product types: simpleProduct (fixed price), drink (sizes), flavoredItem (flavors)
- Bridge tables ensure exactly ONE variant per order item
- `productPriceAtTime` stores historical prices at order creation
- Foreign keys cascade delete order data when parent deleted

---

### 2. `brewtrackDB_data.sql`
**Inserts:** Sample data for testing

**Data:**
- 3 employees (Daiza=Manager, Barias & Jada=Cashiers) with bcrypt-hashed passwords
- 30 ingredients (10 add-on, 20 base for recipes)
- 10 add-ons (Waffle & drink toppings)
- 76 products across 11 categories (31 simple, 25 drinks, 2 flavored)
- 91 drink variants (sizes 12oz/16oz/22oz)
- 6 flavored variants (2 products × 3 flavors each)
- 176 productIngredient mappings (recipes for all products)
- 12 realistic orders (Mar 1-3, 2025) with 33 items + 17 add-ons

**Important Notes:**
- Stock quantities start at 0 for add-on ingredients
- All passwords bcrypt hashed (test: pass1234, pass2341, pass3412)
- Recipes include realistic quantities (e.g., 0.25kg flour per waffle)
- Orders demonstrate all product types, payment methods, discounts (0-15%)

---

### 3. `brewtrackDB_procedures.sql`
**Creates:** 12 stored procedures for POS operations

**Core Procedures:**
| Procedure | Purpose |
|-----------|---------|
| `sp_CreateOrder` | Create order header, returns orderID |
| `sp_AddOrderItem` | Add product variant to order, **auto-deducts stock** |
| `sp_AddOrderItemAddOn` | Add premium add-on to item |
| `sp_GetProductMenu` | Load all products with variant counts (cache on POS startup) |
| `sp_GetProductVariants` | Get sizes/flavors for product |
| `sp_GetAvailableAddOns` | Get add-ons available for product |
| `sp_CalculateOrderTotal` | Compute final total with discount + tax |
| `sp_AuthenticateUser` | Verify login, returns account details or empty set |
| `sp_GetOrderHistory` | Get complete order for receipt printing |
| `sp_GetDailySalesReport` | Daily revenue by payment method |
| `sp_SalesByCategory` | Category sales performance |
| `sp_GetTopSellingProducts` | Best-sellers ranking by revenue |

**Important Notes:**
- All procedures validate inputs and signal errors on failure
- `sp_AddOrderItem` automatically deducts ingredient stock based on `productIngredient` recipe
- Procedures capture prices at order time (historical pricing)
- Bridge tables auto-populate based on product type

---

### 4. `brewtrackDB_procedures_usage.sql`
**Examples:** Real-world usage for each procedure

**Key Scenarios:**
- Complete order flow (create → add items → add add-ons → checkout)
- Menu loading and variant selection
- Employee login and dashboard reports
- JavaScript integration example

**Important Notes:**
- Shows variable assignment with `@` notation
- Demonstrates output variable collection
- Includes error handling patterns

---

### 5. `brewtrackDB_verify.sql`
**Contains:** 15+ verification queries to validate data integrity

**Queries:**
- Product overview with variant counts
- All add-ons per product
- Order summaries with totals
- Employee & account verification
- Ingredient usage per product
- Top sellers analysis

**Important Notes:**
- Run after `brewtrackDB_data.sql` to confirm data loaded correctly
- Identifies missing ingredient mappings (should be empty)
- Validates order item → bridge table relationships

---

### 6. `logs.sql`
**Creates:** Audit infrastructure & triggers

**Components:**
- `audit_trail` table - Detailed change tracking (what/who/when/old/new values)
- `activity_logs` table - Simple message log
- 3 triggers:
  - `trg_ingredient_stock_audit` - Logs ingredient stock changes
  - `trg_after_account_update` - Logs account status changes
  - `trg_after_drink_price_update` - Logs drink price changes

**Important Notes:**
- Triggers fire AFTER UPDATE only (capture changes)
- Audit trail shows old/new values for compliance
- Activity logs auto-insert on ingredient/account/price updates
- No DELETE triggers (preserves historical data)

---

## Key Design Patterns

### Product Polymorphism (3 Types)
```
product (base)
  ├─ simpleProduct (1 price) → Order via orderItemSimpleProduct
  ├─ drink (sizes: 12oz/16oz/22oz) → Order via orderItemDrink
  └─ flavoredItem (flavors) → Order via orderItemFlavoredItem
```
**Why?** Single product table, flexible variants, historical variant tracking

### Bridge Tables
```
orderItem → (exactly ONE of these):
  ├─ orderItemDrink (drinkID → size + price)
  ├─ orderItemFlavoredItem (flavoredItemID → flavor + price)
  └─ orderItemSimpleProduct (simpleProductID → price)
```
**Why?** Data integrity + variant history preservation

### Automatic Stock Deduction
```
sp_AddOrderItem:
  1. Create orderItem
  2. Insert to correct bridge table
  3. Loop productIngredient, UPDATE ingredient.stockQuantity -= (qty × quantityRequired)
```
**Why?** Real-time inventory tracking without manual updates

### Historical Pricing
```
orderItem stores productPriceAtTime (not looked up later)
orderItemAddOn stores addOnPriceAtTime (not looked up later)
```
**Why?** Orders always reflect prices at purchase time, even if prices change

---

## Setup Sequence

**Execute in order:**
1. `brewtrackDB_schema.sql` - Create all tables & indexes
2. `brewtrackDB_data.sql` - Insert sample data
3. `brewtrackDB_procedures.sql` - Create stored procedures
4. `logs.sql` - Create triggers & audit tables

**Optional:**
- `brewtrackDB_verify.sql` - Verify data integrity
- `brewtrackDB_procedures_usage.sql` - Reference examples

---

## Important Notes

### Inventory Management
- 10 add-on ingredients (for premium toppings)
- 20 base ingredients (for product recipes)
- `sp_AddOrderItem` auto-deducts stock
- No manual stock adjustments tracked (outside orders)

### Product Catalog
- 76 total products
- 33 simple (fixed price)
- 25 drinks (3 sizes each = 75 variants)
- 2 flavored items (3 flavors each = 6 variants)
- **All products have productIngredient mappings** (176 total)

### Orders
- 12 sample orders (realistic distribution)
- Support quantity, discount %, tax, payment method
- Add-ons stored with historical prices
- Complete order history available via `sp_GetOrderHistory`

### Authentication
- Passwords: bcrypt hashed
- Roles: Manager (full access) / Cashier (POS only)
- Status: Active/Inactive (inactive accounts fail login)
- No password reset mechanism (manual DB update required)

### Audit & Compliance
- All ingredient, account, price changes logged
- Timestamps on all audit records
- No data deletion (only status changes)
- Perfect for: Inventory audits, personnel tracking, dispute resolution

### Performance
- 11 indexes on frequently queried columns
- Foreign key indexes on all relationships
- Date indexes for range queries on orders
- Category/type indexes for product filtering

---

## Common Workflows

**Create Order:**
```sql
CALL sp_CreateOrder(2, 0, 0, 'Cash', @orderID);
CALL sp_AddOrderItem(@orderID, 62, 60, 1, 130, @itemID);
CALL sp_AddOrderItemAddOn(@itemID, 6, 10, 1);
CALL sp_CalculateOrderTotal(@orderID);
CALL sp_GetOrderHistory(@orderID);
```

**Daily Report:**
```sql
CALL sp_GetDailySalesReport('2025-03-01');
CALL sp_SalesByCategory('2025-03-01', '2025-03-31');
CALL sp_GetTopSellingProducts(10, '2025-03-01', '2025-03-31');
```

**Check Stock:**
```sql
SELECT * FROM ingredient WHERE stockQuantity <= minStockLevel;
```

**Track Changes:**
```sql
SELECT * FROM audit_trail ORDER BY changedAt DESC;
```

### 1. AUTHENTICATION & EMPLOYEE MANAGEMENT

#### `employee` Table
Stores basic employee information.

```sql
CREATE TABLE employee (
    employeeID   INT          PRIMARY KEY AUTO_INCREMENT,
    firstName    VARCHAR(50)  NOT NULL,
    middleName   VARCHAR(50),
    lastName     VARCHAR(50)  NOT NULL,
    phoneNumber  VARCHAR(20)
);
```

**Fields:**
- `employeeID`: Unique identifier (auto-incremented)
- `firstName`: First name of employee
- `middleName`: Middle name (optional)
- `lastName`: Last name of employee
- `phoneNumber`: Contact number

**Sample Data:** 3 employees
- Daiza Janine Fernandez (Manager)
- Barias Dela Torre (Cashier)
- Jada De Asis Parada (Cashier)

---

#### `account` Table
Stores login credentials and role assignments.

```sql
CREATE TABLE account (
    accountID   INT          PRIMARY KEY AUTO_INCREMENT,
    employeeID  INT          NOT NULL,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'Active',
    FOREIGN KEY (employeeID) REFERENCES employee(employeeID)
);
```

**Fields:**
- `accountID`: Unique account identifier
- `employeeID`: Link to employee record
- `username`: Login username (unique)
- `role`: `Manager` or `Cashier`
- `password`: Bcrypt-hashed password
- `status`: `Active` or `Inactive`

**Key Points:**
- Passwords are bcrypt hashed (2-way hashing for storage security)
- Each employee has one account (1:1 relationship)
- Status can be used to disable accounts without deletion

---

### 2. INVENTORY MANAGEMENT

#### `ingredient` Table
Tracks all base ingredients used in products.

```sql
CREATE TABLE ingredient (
    ingredientID   INT             PRIMARY KEY AUTO_INCREMENT,
    ingredientName VARCHAR(100)    NOT NULL,
    stockQuantity  DECIMAL(10, 2)  NOT NULL DEFAULT 0,
    minStockLevel  DECIMAL(10, 2)  NOT NULL DEFAULT 0,
    unit           VARCHAR(20),
    expiryDate     DATE
);
```

**Fields:**
- `ingredientID`: Unique identifier
- `ingredientName`: Name of ingredient
- `stockQuantity`: Current available stock
- `minStockLevel`: Alert threshold for low stock
- `unit`: Measurement unit (kg, L, dozen, pcs, cans)
- `expiryDate`: Expiration date (NULL if non-perishable)

**Sample Ingredients (30 total):**
- **Add-on ingredients** (IDs 1-10): Whipped Cream, Drizzle, Mallows, Crushed Oreo, etc.
- **Baking ingredients** (IDs 11-14): Flour, Eggs, Butter, Sugar
- **Proteins** (IDs 16-19): Pork, Chicken, Fish, Beef
- **Beverages** (IDs 20-22): Fresh Milk, Tea Leaves, Coffee Beans
- **Pantry items** (IDs 23-30): Oil, Potatoes, Bread, Tuna, Yogurt Base, Fruit Puree, etc.

---

#### `ingredient` + `addOn` + `productAddOn` Workflow

**`addOn` Table** - Premium add-ons customers can purchase

```sql
CREATE TABLE addOn (
    addOnID      INT             PRIMARY KEY AUTO_INCREMENT,
    ingredientID INT             NOT NULL,
    addOnName    VARCHAR(100)    NOT NULL,
    addOnPrice   DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (ingredientID) REFERENCES ingredient(ingredientID)
);
```

**10 Add-ons Available:**
- Waffle add-ons: Whipped Cream (PHP25), Drizzle (PHP15), Mallows (PHP15), Crushed Oreo (PHP15), Fruits Jam (PHP25)
- Drink add-ons: Cream Cheese (PHP10), Black Pearl (PHP10), Nata (PHP10), Popping Boba (PHP15), Espresso Shot (PHP30)

**`productAddOn` Table** - Links which add-ons are available for each product

```sql
CREATE TABLE productAddOn (
    productAddOnID   INT             PRIMARY KEY AUTO_INCREMENT,
    productID        INT             NOT NULL,
    addOnID          INT             NOT NULL,
    quantityRequired DECIMAL(10, 2)  NOT NULL,
    UNIQUE KEY unique_product_addon (productID, addOnID)
);
```

**Fields:**
- `productID`: The product this add-on is available for
- `addOnID`: The add-on being offered
- `quantityRequired`: Amount of ingredient used (e.g., 0.05L whipped cream per waffle)

**Availability:**
- Waffles (21-28): All 5 waffle add-ons available
- All drinks (29-76): All 5 drink add-ons available

---

### 3. PRODUCT CATALOG SYSTEM

The product system uses a **polymorphic design** with 3 types:

#### `product` Table - Base Product Information

```sql
CREATE TABLE product (
    productID    INT          PRIMARY KEY AUTO_INCREMENT,
    productName  VARCHAR(100) NOT NULL,
    productType  ENUM('simpleProduct', 'drink', 'flavoredItem') NOT NULL,
    category     VARCHAR(50),
    imageURL     VARCHAR(255)
);
```

**76 Products** across **11 Categories:**
- Snacks (6)
- Sharing/Barkada Bundles (3)
- Rice Meals (8)
- Extras (3)
- Waffles (8)
- Milk Tea (6)
- Fruit Milk (3)
- Yogurts (3)
- Fruit Tea (3)
- Soda Pops (3)
- Matcha Series (4)
- Juice (1)
- Signature Drink (1)
- Tea (3)
- Coffee (9)
- Coffee Based Frappe (4)
- Cream Based Frappe (8)

---

#### Type 1: `simpleProduct` - Single Price Items

```sql
CREATE TABLE simpleProduct (
    simpleProductID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID        INT             NOT NULL UNIQUE,
    price            DECIMAL(10, 2)  NOT NULL,
    FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE
);
```

**Examples:**
- Siomai (5pcs) - PHP 39.00
- Plain Waffle - PHP 70.00
- Rice Meals (139.00 avg)
- Yogurts - PHP 95.00

**Use Case:** Fixed-price items with no variants

---

#### Type 2: `drink` - Size Variants

```sql
CREATE TABLE drink (
    drinkID    INT             PRIMARY KEY AUTO_INCREMENT,
    productID  INT             NOT NULL,
    size       VARCHAR(20)     NOT NULL,
    price      DECIMAL(10, 2)  NOT NULL,
    UNIQUE KEY unique_drink_size (productID, size)
);
```

**Size Options:**
- 12oz (small)
- 16oz (medium)
- 22oz (large)

**Examples:**
- Cafe Latte: 12oz (PHP99) → 16oz (PHP120) → 22oz (PHP135)
- Coffee varies by size and base (Americano cheaper than Latte)

**91 Drink Records** for all beverages

---

#### Type 3: `flavoredItem` - Flavor Variants

```sql
CREATE TABLE flavoredItem (
    flavoredItemID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID       INT             NOT NULL,
    flavorName      VARCHAR(50)     NOT NULL,
    price           DECIMAL(10, 2)  NOT NULL,
    UNIQUE KEY unique_flavored_item (productID, flavorName)
);
```

**Examples:**
- Fries Solo: Cheese/BBQ/Sour Cream (PHP 79 each)
- Fries Overload: Cheese/BBQ/Sour Cream (PHP 125 each)

**6 Flavored Items** (2 products × 3 flavors)

---

#### `productIngredient` Table - Product Recipes

```sql
CREATE TABLE productIngredient (
    productIngredientID  INT             PRIMARY KEY AUTO_INCREMENT,
    productID            INT             NOT NULL,
    ingredientID         INT             NOT NULL,
    quantityRequired     DECIMAL(10, 2)  NOT NULL,
    UNIQUE KEY unique_product_ingredient (productID, ingredientID)
);
```

**176 Mappings** covering all 76 products:

**Example Recipes:**
- Plain Waffle: 0.25kg Flour + 0.15 Eggs + 0.10kg Sugar + 0.08kg Butter + 0.10L Milk
- Cafe Latte: 0.04kg Coffee Beans + 0.15L Milk + 0.03kg Sugar
- Pork Tonkatsu: 0.80kg Rice + 0.30kg Pork + 0.10L Oil + 0.10kg Flour + 0.05 Eggs

**Purpose:** Automatic stock deduction when orders placed

---

### 4. ORDER & TRANSACTION SYSTEM

#### `orders` Table - Order Header

```sql
CREATE TABLE orders (
    orderID         INT             PRIMARY KEY AUTO_INCREMENT,
    accountID       INT             NOT NULL,
    dateAndTime     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discountPercent DECIMAL(5, 2)   DEFAULT 0,
    taxAmount       DECIMAL(10, 2)  DEFAULT 0,
    paymentMethod   VARCHAR(20),
    FOREIGN KEY (accountID) REFERENCES account(accountID)
);
```

**Fields:**
- `orderID`: Unique order identifier
- `accountID`: Cashier who processed order
- `dateAndTime`: Order timestamp
- `discountPercent`: Order-level discount (0-100%)
- `taxAmount`: Tax (if applicable)
- `paymentMethod`: Cash / GCash / Credit Card

**Sample Data:** 12 orders across 3 days (Mar 1-3, 2025)

---

#### `orderItem` Table - Line Items

```sql
CREATE TABLE orderItem (
    orderItemID        INT             PRIMARY KEY AUTO_INCREMENT,
    orderID            INT             NOT NULL,
    productID          INT             NOT NULL,
    productPriceAtTime DECIMAL(10, 2)  NOT NULL,
    lineTotal          DECIMAL(10, 2)  NOT NULL,
    productQuantity    INT             NOT NULL DEFAULT 1,
    FOREIGN KEY (orderID)   REFERENCES orders(orderID) ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES product(productID)
);
```

**Key Features:**
- **Historical Pricing:** `productPriceAtTime` captures the exact price when ordered (not lookup time)
- **Line Total:** Auto-calculated as quantity × price
- **Quantity Support:** For bulk orders or multiple units

**33 Order Items** across 12 orders

---

#### Bridge Tables (Product Variant Selection)

**Problem:** An order item needs to know which variant was ordered (size/flavor/simple)

**Solution:** Three mutually-exclusive bridge tables (exactly ONE per orderItem)

---

##### `orderItemDrink` - For Drink Orders

```sql
CREATE TABLE orderItemDrink (
    orderItemDrinkID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID       INT  NOT NULL UNIQUE,
    drinkID           INT  NOT NULL,
    FOREIGN KEY (orderItemID) REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (drinkID)     REFERENCES drink(drinkID)
);
```

**Example:**
- Order Item: Caramel Macchiato
- Bridge: links to drinkID 60 (which is 16oz size at PHP130)

---

##### `orderItemFlavoredItem` - For Flavored Orders

```sql
CREATE TABLE orderItemFlavoredItem (
    orderItemFlavoredItemID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID              INT  NOT NULL UNIQUE,
    flavoredItemID           INT  NOT NULL,
    FOREIGN KEY (orderItemID)    REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (flavoredItemID) REFERENCES flavoredItem(flavoredItemID)
);
```

**Example:**
- Order Item: Fries Solo
- Bridge: links to flavoredItemID 1 (Cheese flavor at PHP79)

---

##### `orderItemSimpleProduct` - For Simple Product Orders

```sql
CREATE TABLE orderItemSimpleProduct (
    orderItemSimpleProductID  INT  PRIMARY KEY AUTO_INCREMENT,
    orderItemID               INT  NOT NULL UNIQUE,
    simpleProductID           INT  NOT NULL,
    FOREIGN KEY (orderItemID)     REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (simpleProductID) REFERENCES simpleProduct(simpleProductID)
);
```

**Example:**
- Order Item: Siomai (5pcs)
- Bridge: links to simpleProductID 1 (PHP39)

**Why This Design?**
1. **Data Integrity:** Ensures exactly one variant per item
2. **Historical Tracking:** Records which exact variant was ordered
3. **Flexibility:** Each type has its own specific fields if needed

---

#### `orderItemAddOn` Table - Premium Add-ons on Orders

```sql
CREATE TABLE orderItemAddOn (
    orderItemAddOnID  INT             PRIMARY KEY AUTO_INCREMENT,
    orderItemID       INT             NOT NULL,
    addOnID           INT             NOT NULL,
    addOnPriceAtTime  DECIMAL(10, 2)  NOT NULL,
    addOnQuantity     INT             NOT NULL DEFAULT 1,
    FOREIGN KEY (orderItemID) REFERENCES orderItem(orderItemID) ON DELETE CASCADE,
    FOREIGN KEY (addOnID)     REFERENCES addOn(addOnID)
);
```

**Fields:**
- `addOnPriceAtTime`: Historical add-on price
- `addOnQuantity`: How many of this add-on (e.g., 2x Espresso shots)

**Example:**
- Order Item: Caramel Macchiato
- Add-ons: Cream Cheese (PHP10) + Black Pearl (PHP10)
- Result: 2 rows in this table

**17 Add-on Records** across orders

---

### 5. AUDIT & LOGGING

#### `activity_logs` Table - Simple Change Log

```sql
CREATE TABLE activity_logs (
    id           INT          PRIMARY KEY AUTO_INCREMENT,
    log_message  VARCHAR(255),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

**Triggered by:**
- Ingredient stock updates
- Account status changes
- Drink price changes

**Example Logs:**
- "Ingredient ID 1 (Whipped Cream) stock changed from 50.00 to 45.00 L"
- "Account ID 2 (barias) status changed from Active to Inactive"

---

#### `audit_trail` Table - Detailed Change Tracking

```sql
CREATE TABLE audit_trail (
    auditID       INT           PRIMARY KEY AUTO_INCREMENT,
    tableName     VARCHAR(50)   NOT NULL,
    recordID      INT           NOT NULL,
    fieldChanged  VARCHAR(50)   NOT NULL,
    oldValue      VARCHAR(100),
    newValue      VARCHAR(100),
    changedAt     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `tableName`: Which table was modified (ingredient, account, drink, etc.)
- `recordID`: Which record in that table
- `fieldChanged`: Which column changed
- `oldValue` / `newValue`: Before and after values
- `changedAt`: Timestamp of change

**Compliance Use:** Track all changes for audit purposes

---

#### Triggers

**`trg_ingredient_stock_audit`** - Logs ingredient stock changes

```sql
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
END;
```

**`trg_after_account_update`** - Logs account status changes

**`trg_after_drink_price_update`** - Logs drink price changes

---

### 6. INDEXES FOR PERFORMANCE

```sql
CREATE INDEX idx_product_type      ON product(productType);
CREATE INDEX idx_product_category  ON product(category);
CREATE INDEX idx_drink_product     ON drink(productID);
CREATE INDEX idx_flavored_product  ON flavoredItem(productID);
CREATE INDEX idx_order_account     ON orders(accountID);
CREATE INDEX idx_order_date        ON orders(dateAndTime);
CREATE INDEX idx_orderitem_order   ON orderItem(orderID);
CREATE INDEX idx_orderitem_product ON orderItem(productID);
CREATE INDEX idx_audit_record      ON audit_trail(recordID);
CREATE INDEX idx_audit_table       ON audit_trail(tableName);
CREATE INDEX idx_audit_changed_at  ON audit_trail(changedAt);
CREATE INDEX idx_pi_ingredient     ON productIngredient(ingredientID);
```

**Optimization Strategy:**
- Foreign key columns indexed for JOIN operations
- Date columns indexed for range queries
- Categorical columns indexed for filtering

---

## Data Model

### Entity Relationship Diagram (Conceptual)

```
EMPLOYEE ─────────────── ACCOUNT ──────────────┐
                                               │
                                               ├──→ ORDERS
                                               │
INGREDIENT ──→ ADD-ON ──→ PRODUCT-ADD-ON       │
              (available on products)          │
              ↓                                │
         (auto-deduct stock)                   ├──→ ORDER-ITEM ──┬─→ DRINK (size variant)
              ↓                                │                 ├─→ FLAVORED-ITEM (flavor)
         PRODUCT-INGREDIENT                   │                 └─→ SIMPLE-PRODUCT
              ↓                                │
         PRODUCT ←────────────────────────────┘
              ├─→ SIMPLE-PRODUCT
              ├─→ DRINK (by size)
              └─→ FLAVORED-ITEM (by flavor)
```

### Data Flow: Order Creation

1. **Cashier logs in** → account validated via `sp_AuthenticateUser`
2. **Cashier creates order** → `sp_CreateOrder` creates `orders` header
3. **Customer selects product** → `sp_GetProductMenu` shows catalog
4. **Customer picks variant** → `sp_GetProductVariants` returns sizes/flavors
5. **Add item to order** → `sp_AddOrderItem`:
   - Creates `orderItem` with price snapshot
   - Auto-inserts to correct bridge table (drink/flavored/simple)
   - **Auto-deducts ingredient stock** from `productIngredient` recipe
6. **Customer adds premium add-ons** → `sp_AddOrderItemAddOn`:
   - Records each add-on with price + quantity
   - **Auto-deducts add-on ingredient stock**
7. **Checkout** → `sp_CalculateOrderTotal` computes final amount
8. **Receipt** → `sp_GetOrderHistory` displays complete order

---

## Stored Procedures

### 1. `sp_CreateOrder`

**Purpose:** Create a new order header  
**Input:** accountID, discountPercent, taxAmount, paymentMethod  
**Output:** orderID (success) or NULL (error)

```sql
CALL sp_CreateOrder(2, 0, 0, 'Cash', @orderID);
SELECT @orderID;  -- Returns: 13
```

**Validation:**
- Checks accountID is valid and > 0
- Defaults discount/tax/payment if NULL
- Returns NULL if any error occurs

---

### 2. `sp_AddOrderItem`

**Purpose:** Add product to order with variant and auto-deduct stock  
**Input:** orderID, productID, variantID, quantity, priceAtTime  
**Output:** orderItemID

```sql
CALL sp_AddOrderItem(13, 62, 60, 1, 130.00, @itemID);
-- Adds 1x Caramel Macchiato (16oz, PHP130) to order 13
-- Auto-deducts: 0.04kg Coffee Beans, 0.15L Milk, 0.03kg Sugar
```

**Actions:**
1. Validates inputs
2. Retrieves product type
3. Creates `orderItem` row
4. Inserts to appropriate bridge table based on type
5. **Loops through `productIngredient` and deducts stock:**
   ```sql
   UPDATE ingredient 
   SET stockQuantity = stockQuantity - (quantityRequired * quantity)
   WHERE ingredientID = ...
   ```
6. Commits transaction or rolls back on error

---

### 3. `sp_AddOrderItemAddOn`

**Purpose:** Add premium add-on to order item  
**Input:** orderItemID, addOnID, addOnPrice, quantity  
**Output:** None (inserts directly)

```sql
CALL sp_AddOrderItemAddOn(1, 6, 10.00, 1);
-- Adds Cream Cheese add-on to order item 1
-- Price: PHP10, Qty: 1
```

**Note:** No automatic stock deduction (add-on ingredients already deducted when ordered)

---

### 4. `sp_GetProductMenu`

**Purpose:** Load complete menu for POS display  
**Input:** None  
**Output:** All products with base price and variant count

```sql
CALL sp_GetProductMenu();
```

**Returns:**
```
productID | productName           | category    | basePrice | variantCount
---------|----------------------|-------------|-----------|-------------
21        | Plain Waffle         | Waffles     | 70.00     | 1
62        | Caramel Macchiato    | Coffee      | 115.00    | 3 (3 sizes)
2         | Fries Solo           | Snacks      | 79.00     | 3 (3 flavors)
```

**Use Case:** Cache on POS startup for instant menu access

---

### 5. `sp_GetProductVariants`

**Purpose:** Get all sizes/flavors for a product  
**Input:** productID  
**Output:** Variants with prices and display labels

```sql
CALL sp_GetProductVariants(62);  -- Caramel Macchiato
```

**Returns (for drinks):**
```
variantID | variantName | price | displayLabel
----------|------------|-------|---------------------
59        | 12oz       | 115   | 12oz - PHP 115
60        | 16oz       | 130   | 16oz - PHP 130
61        | 22oz       | 145   | 22oz - PHP 145
```

---

### 6. `sp_GetAvailableAddOns`

**Purpose:** Get add-ons available for product  
**Input:** productID  
**Output:** Add-on details with pricing

```sql
CALL sp_GetAvailableAddOns(62);  -- Caramel Macchiato
```

**Returns:**
```
addOnID | addOnName      | addOnPrice | displayLabel
--------|----------------|-----------|------------------------
6       | Cream Cheese   | 10.00     | Cream Cheese - PHP 10
7       | Black Pearl    | 10.00     | Black Pearl - PHP 10
8       | Nata           | 10.00     | Nata - PHP 10
9       | Popping Boba   | 15.00     | Popping Boba - PHP 15
10      | Espresso Shot  | 30.00     | Espresso Shot - PHP 30
```

---

### 7. `sp_CalculateOrderTotal`

**Purpose:** Compute final order total with discount and tax  
**Input:** orderID  
**Output:** Subtotal, discount%, discountAmt, tax, finalTotal

```sql
CALL sp_CalculateOrderTotal(3);
```

**Returns:**
```
subtotal | discountPercent | discountAmount | taxAmount | finalTotal
---------|-----------------|----------------|-----------|----------
488.00   | 10.00           | 48.80          | 0.00      | 439.20
```

**Formula:**
```
finalTotal = subtotal - (subtotal × discountPercent/100) + taxAmount
```

---

### 8. `sp_AuthenticateUser`

**Purpose:** Verify employee login credentials  
**Input:** username, password  
**Output:** Account details if valid, empty set if failed

```sql
CALL sp_AuthenticateUser('barias', 'pass2341');
```

**Returns (on success):**
```
accountID | username | role    | status | employeeName      | phoneNumber
----------|----------|---------|--------|-------------------|-------------
2         | barias   | Cashier | Active | Barias Dela Torre | 09181234568
```

**Returns (on failure):** Empty result set

**Security:**
- Queries by username
- Compares hashed password (app-side: bcrypt.compare)
- Checks status = 'Active' (disabled accounts fail)

---

### 9. `sp_GetOrderHistory`

**Purpose:** Retrieve complete order with all items and add-ons (for receipt)  
**Input:** orderID  
**Output:** Detailed order with variants and add-ons

```sql
CALL sp_GetOrderHistory(1);
```

**Returns:**
```
orderID | dateAndTime         | cashierName | productName       | variant | qty | unitPrice | lineTotal | addOns
--------|---------------------|-------------|-------------------|---------|-----|-----------|-----------|---------------------------
1       | 2025-03-01 09:15:00 | Barias      | Siomai (5pcs)     | Standard| 1   | 39.00     | 39.00     | None
1       | 2025-03-01 09:15:00 | Barias      | Caramel Macchiato | 16oz    | 1   | 130.00    | 130.00    | Cream Cheese (1x), Black Pearl (1x)
```

---

### 10. `sp_GetDailySalesReport`

**Purpose:** Generate daily sales summary by payment method  
**Input:** date (YYYY-MM-DD)  
**Output:** Revenue metrics by payment method

```sql
CALL sp_GetDailySalesReport('2025-03-01');
```

**Returns:**
```
orderDate  | totalOrders | paymentMethod | orderCount | revenue | avgOrderValue
-----------|-------------|---------------|-----------|---------|---------------
2025-03-01 | 5           | Cash          | 3         | 900.00  | 300.00
2025-03-01 | 5           | GCash         | 2         | 800.00  | 400.00
```

**Use Case:** Manager dashboard - daily overview

---

### 11. `sp_SalesByCategory`

**Purpose:** Sales performance per product category  
**Input:** startDate, endDate (YYYY-MM-DD)  
**Output:** Revenue and quantity by category

```sql
CALL sp_SalesByCategory('2025-03-01', '2025-03-31');
```

**Returns:**
```
category         | itemsSold | totalQuantity | categoryRevenue | avgItemPrice | revenuePerItem
-----------------|-----------|---------------|-----------------|--------------|---------------
Coffee           | 12        | 14            | 1480.00         | 120.00       | 123.33
Waffles          | 8         | 9             | 820.00          | 100.00       | 102.50
Rice Meals       | 6         | 7             | 850.00          | 130.00       | 141.67
```

**Sorted by:** Revenue descending

---

### 12. `sp_GetTopSellingProducts`

**Purpose:** Best-seller ranking for a date range  
**Input:** limit (e.g., 10), startDate, endDate  
**Output:** Top N products by revenue

```sql
CALL sp_GetTopSellingProducts(5, '2025-03-01', '2025-03-31');
```

**Returns:**
```
productID | productName              | category         | timesSold | totalQuantity | totalRevenue | avgPrice
----------|--------------------------|------------------|-----------|---------------|--------------|----------
62        | Caramel Macchiato        | Coffee           | 3         | 3             | 385.00       | 128.33
8         | Barkada Bundle 2         | Sharing          | 1         | 1             | 249.00       | 249.00
21        | Plain Waffle             | Waffles          | 2         | 2             | 140.00       | 70.00
```

**Use Case:** Inventory planning, menu optimization

---

## Sample Data

### Employees (3 total)
```
ID | Name                        | Username | Role      | Password Hash (bcrypt)
---|----------------------------|----------|-----------|-----------------------------------
1  | Daiza Janine Fernandez    | janine   | Manager   | $2b$10$tLi91nP7RDnOcFHP7oMBRu...
2  | Barias Dela Torre         | barias   | Cashier   | $2b$10$8W/z/r3tzqoTyjLVY7iVRu...
3  | Jada De Asis Parada       | jada     | Cashier   | $2b$10$0mk49XHN2z9aRdqE/tuil...
```

**Default Passwords (for testing):**
- janine: pass1234
- barias: pass2341
- jada: pass3412

---

### Ingredients (30 total)

**Add-on Ingredients (IDs 1-10):**
- ID 1-5: Waffle toppings (Whipped Cream, Drizzle, Mallows, etc.)
- ID 6-10: Drink add-ons (Cream Cheese, Black Pearl, Nata, etc.)

**Base Ingredients (IDs 11-30):**
- Baking: 11 (Flour), 12 (Eggs), 13 (Butter), 14 (Sugar)
- Meats: 16-19 (Pork, Chicken, Fish, Beef)
- Staples: 15 (Rice), 20 (Milk), 21 (Tea), 22 (Coffee)
- Pantry: 23 (Oil), 24 (Potatoes), 25 (Bread), 26 (Tuna), 27 (Yogurt), 28 (Fruit Puree), 29 (Carbonated Water), 30 (Salt)

---

### Products (76 total)

**Distribution:**
- Simple Products: 33 (fixed price)
- Drinks: 43 variants across 25 products
- Flavored Items: 6 (2 products × 3 flavors)

**Price Range:**
- Lowest: Dip Sauce (PHP 10)
- Highest: Barkada Bundle 3 (PHP 349)
- Average: ~PHP 100-120

---

### Orders (12 realistic examples)

**Dates:**
- March 1, 2025: 5 orders
- March 2, 2025: 5 orders
- March 3, 2025: 2 orders

**Payment Methods:**
- Cash: 8 orders (66%)
- GCash: 2 orders (17%)
- Credit Card: 2 orders (17%)

**Discounts:**
- No discount: 9 orders
- 5% discount: 1 order
- 10% discount: 1 order
- 15% discount: 1 order

**Order Statistics:**
- Total Items: 33 line items
- Total Add-ons: 17 premium add-ons
- Average Order: PHP 300-400
- Sample Complex Order: 4 items + 3 add-ons

---

## Verification Queries

### Overview Queries

**All products with variants:**
```sql
SELECT p.productID, p.productName, p.productType, p.category,
       COUNT(DISTINCT d.drinkID) as drink_variants,
       COUNT(DISTINCT fi.flavoredItemID) as flavor_variants
FROM product p
LEFT JOIN drink d ON p.productID = d.productID
LEFT JOIN flavoredItem fi ON p.productID = fi.productID
GROUP BY p.productID;
```

**Product type distribution:**
```sql
SELECT productType, COUNT(*) as count FROM product GROUP BY productType;
```

**Results:**
- simpleProduct: 33
- drink: 25
- flavoredItem: 2

---

### Inventory Queries

**Current stock levels:**
```sql
SELECT ingredientID, ingredientName, stockQuantity, minStockLevel, unit
FROM ingredient
WHERE stockQuantity < minStockLevel
ORDER BY stockQuantity ASC;
```

**Ingredients below minimum:**
```
(All 10 add-on ingredients start at 0, well below their min level)
```

**Product ingredient requirements (for reordering):**
```sql
SELECT p.productName, i.ingredientName, pi.quantityRequired, i.unit
FROM productIngredient pi
JOIN product p ON pi.productID = p.productID
JOIN ingredient i ON pi.ingredientID = i.ingredientID
ORDER BY p.category, p.productName;
```

---

### Order Analytics Queries

**Daily revenue:**
```sql
SELECT DATE(o.dateAndTime) as orderDate, 
       COUNT(o.orderID) as orders,
       SUM(oi.lineTotal) as revenue,
       AVG(oi.lineTotal) as avgOrderValue
FROM orders o
JOIN orderItem oi ON o.orderID = oi.orderID
GROUP BY DATE(o.dateAndTime);
```

**Results:**
- 2025-03-01: 5 orders, PHP ~1,700
- 2025-03-02: 5 orders, PHP ~1,400
- 2025-03-03: 2 orders, PHP ~620

**Top products by revenue:**
```sql
SELECT p.productName, SUM(oi.lineTotal) as revenue, COUNT(oi.orderItemID) as times_sold
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
GROUP BY oi.productID
ORDER BY revenue DESC
LIMIT 10;
```

**Top performing categories:**
```sql
SELECT p.category, COUNT(*) as items_sold, SUM(oi.lineTotal) as revenue
FROM orderItem oi
JOIN product p ON oi.productID = p.productID
GROUP BY p.category
ORDER BY revenue DESC;
```

---

### Audit Queries

**Track ingredient changes:**
```sql
SELECT * FROM audit_trail 
WHERE tableName = 'ingredient' 
ORDER BY changedAt DESC;
```

**Account activity:**
```sql
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

**Order completion (to verify no orphans):**
```sql
SELECT COUNT(*) as total_orders,
       SUM(CASE WHEN oi.orderItemID IS NOT NULL THEN 1 ELSE 0 END) as orders_with_items
FROM orders o
LEFT JOIN orderItem oi ON o.orderID = oi.orderID;
```

---

## Audit & Logging

### Triggers Overview

**Three automatic logging triggers:**

1. **`trg_ingredient_stock_audit`**
   - Fires: AFTER UPDATE on `ingredient` table
   - Logs: Stock quantity changes (old → new)
   - Example: "Whipped Cream: 50L → 45L"

2. **`trg_after_account_update`**
   - Fires: AFTER UPDATE on `account` table
   - Logs: Status changes (Active ↔ Inactive)
   - Example: "User 'barias' status: Active → Inactive"

3. **`trg_after_drink_price_update`**
   - Fires: AFTER UPDATE on `drink` table
   - Logs: Price changes
   - Example: "Caramel Macchiato 16oz: PHP 130 → PHP 135"

### Activity Log Example

```
id  | log_message                                        | created_at
----|----------------------------------------------------|-----------------------
1   | Ingredient ID 1 (Whipped Cream) stock changed      | 2025-03-01 09:15:30
    | from 50.00 to 45.00 L                              |
2   | Account ID 2 (barias) status changed from Active   | 2025-03-01 10:30:45
    | to Inactive                                         |
3   | Drink ID 60 (16oz) price changed from PHP 130      | 2025-03-01 14:22:10
    | to PHP 135                                          |
```

### Audit Trail Example

```
auditID | tableName  | recordID | fieldChanged  | oldValue | newValue | changedAt
--------|------------|----------|---------------|----------|----------|------------------
1       | ingredient | 1        | stockQuantity | 50.00 L  | 45.00 L  | 2025-03-01 09:15:30
2       | account    | 2        | status        | Active   | Inactive | 2025-03-01 10:30:45
3       | drink      | 60       | price         | 130.00   | 135.00   | 2025-03-01 14:22:10
```

### Compliance Use Cases

1. **Stock Audits:** Verify ingredient consumption matches orders
2. **Personnel Tracking:** Who disabled which accounts and when
3. **Price History:** Track pricing changes for cost analysis
4. **Dispute Resolution:** Prove what price was charged at order time

---

## Usage Examples

### Scenario 1: Customer Orders Caramel Macchiato with Add-ons

**1. Login:**
```sql
CALL sp_AuthenticateUser('barias', 'pass2341');
-- Returns: accountID = 2
```

**2. Get Menu:**
```sql
CALL sp_GetProductMenu();
-- Returns: All 76 products with prices
```

**3. Create Order:**
```sql
CALL sp_CreateOrder(2, 0, 0, 'Cash', @orderID);
-- Result: @orderID = 13
```

**4. Get Variants:**
```sql
CALL sp_GetProductVariants(62);  -- Caramel Macchiato
-- Returns: 12oz/16oz/22oz sizes with prices
-- User selects: 16oz (drinkID 60)
```

**5. Get Add-ons:**
```sql
CALL sp_GetAvailableAddOns(62);
-- Returns: 5 drink add-ons available
-- User selects: Cream Cheese + Black Pearl
```

**6. Add Item to Order:**
```sql
CALL sp_AddOrderItem(13, 62, 60, 1, 130.00, @itemID);
-- Result: @itemID = 1
-- Auto-deducts: 0.04kg Coffee, 0.15L Milk, 0.03kg Sugar
```

**7. Add Add-ons:**
```sql
CALL sp_AddOrderItemAddOn(1, 6, 10.00, 1);   -- Cream Cheese
CALL sp_AddOrderItemAddOn(1, 7, 10.00, 1);   -- Black Pearl
```

**8. Checkout:**
```sql
CALL sp_CalculateOrderTotal(13);
-- Returns: subtotal=150, discount=0, tax=0, total=150
```

**9. Print Receipt:**
```sql
CALL sp_GetOrderHistory(13);
-- Returns: Order details with all items and add-ons
```

---

### Scenario 2: Manager Checks Daily Sales

**Morning Report:**
```sql
CALL sp_GetDailySalesReport('2025-03-01');
-- Returns: 5 orders, PHP 1,700+ revenue by payment method
```

**Category Analysis:**
```sql
CALL sp_SalesByCategory('2025-03-01', '2025-03-03');
-- Returns: Which categories generated most revenue
```

**Top Products:**
```sql
CALL sp_GetTopSellingProducts(10, '2025-03-01', '2025-03-31');
-- Returns: Top 10 sellers for inventory planning
```

---

### Scenario 3: Stock Management

**Check Low Stock:**
```sql
SELECT ingredientID, ingredientName, stockQuantity, minStockLevel
FROM ingredient
WHERE stockQuantity <= minStockLevel;
```

**View Consumption:**
```sql
SELECT i.ingredientName, SUM(pi.quantityRequired) as total_per_order
FROM productIngredient pi
JOIN ingredient i ON pi.ingredientID = i.ingredientID
GROUP BY i.ingredientID
ORDER BY total_per_order DESC;
```

---

## Execution Order

**To Set Up Database:**

1. **`brewtrackDB_schema.sql`** - Create all tables and indexes
2. **`brewtrackDB_data.sql`** - Insert sample data (employees, products, orders)
3. **`brewtrackDB_procedures.sql`** - Create all 12 stored procedures
4. **`logs.sql`** - Create triggers and audit tables

**Optional:**
- **`brewtrackDB_verify.sql`** - Run verification queries to validate data
- **`brewtrackDB_procedures_usage.sql`** - Example usage of each procedure

---

## Summary

**BrewTrack Database Features:**

✅ **Multi-variant products** (sizes, flavors, simple items)  
✅ **Automatic inventory tracking** (stock deduction on order)  
✅ **Historical pricing** (prices captured at order time)  
✅ **Role-based authentication** (Manager/Cashier)  
✅ **Premium add-ons** (flexible, per-item customization)  
✅ **Order analytics** (daily, category, top-sellers)  
✅ **Audit trail** (compliance and tracking)  
✅ **Stored procedures** (safe, reusable business logic)  
✅ **Performance indexes** (optimized for POS operations)  

**Ready for:** Real-time POS transactions + historical reporting + compliance auditing

