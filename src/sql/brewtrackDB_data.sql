-- SAMPLE DATA FOR BREWTRACK POS DATABASE
-- Execute after brewtrackDB_schema.sql

-- EMPLOYEES & ACCOUNTS
INSERT INTO employee (employeeID, firstName, middleName, lastName, phoneNumber) VALUES
(1, 'Daiza Janine', 'N/A',     'Fernandez',  '09171234567'),
(2, 'Barias',       'N/A',     'Dela Torre', '09181234568'),
(3, 'Jada',         'De Asis', 'Parada',     '09191234569');

INSERT INTO account (accountID, employeeID, username, role, password, status) VALUES
(1, 1, 'janine', 'Manager', '$2b$10$tLi91nP7RDnOcFHP7oMBRugY/WW/DsCW6RMCBwEwxdZFumoKawGSy', 'Active'),
-- pass1234
(2, 2, 'barias', 'Cashier', '$2b$10$8W/z/r3tzqoTyjLVY7iVRuKtzJWT6H.KoNejfZqmYP9LVSfxNgD0u', 'Active'),
-- pass2341
(3, 3, 'jada',   'Cashier', '$2b$10$0mk49XHN2z9aRdqE/tuilOam7hNBrIyryhshjgXq0pyioDiwqxah2', 'Active');
-- pass3412

-- INGREDIENTS (add-on backing ingredients)
INSERT INTO ingredient (ingredientID, ingredientName, stockQuantity, minStockLevel, unit, expiryDate) VALUES
-- Waffle add-on ingredients
(1, 'Whipped Cream',  0.00, 0.00, 'L',   NULL),
(2, 'Drizzle',        0.00, 0.00, 'L',   NULL),
(3, 'Mallows',        0.00, 0.00, 'kg',  NULL),
(4, 'Crushed Oreo',   0.00, 0.00, 'kg',  NULL),
(5, 'Fruits Jam',     0.00, 0.00, 'kg',  NULL),
-- Drink add-on ingredients
(6, 'Cream Cheese',   0.00, 0.00, 'kg',  NULL),
(7, 'Black Pearl',    0.00, 0.00, 'kg',  NULL),
(8, 'Nata',           0.00, 0.00, 'kg',  NULL),
(9, 'Popping Boba',   0.00, 0.00, 'kg',  NULL),
(10,'Espresso',       0.00, 0.00, 'kg',  NULL),
-- Base ingredients for products
(11, 'All-Purpose Flour',     50.00, 10.00, 'kg',  NULL),
(12, 'Eggs',                  100.00, 20.00, 'dozen', NULL),
(13, 'Butter',                20.00, 5.00, 'kg',  NULL),
(14, 'Sugar',                 30.00, 5.00, 'kg',  NULL),
(15, 'White Rice',            80.00, 20.00, 'kg',  NULL),
(16, 'Pork Meat',             40.00, 10.00, 'kg',  NULL),
(17, 'Chicken Meat',          35.00, 10.00, 'kg',  NULL),
(18, 'Fish Fillet',           20.00, 5.00, 'kg',  NULL),
(19, 'Beef',                  30.00, 5.00, 'kg',  NULL),
(20, 'Fresh Milk',            50.00, 10.00, 'L',   NULL),
(21, 'Tea Leaves',            10.00, 2.00, 'kg',  '2026-12-31'),
(22, 'Coffee Beans',          15.00, 3.00, 'kg',  '2026-11-30'),
(23, 'Vegetable Oil',         30.00, 10.00, 'L',   NULL),
(24, 'Potatoes',              50.00, 10.00, 'kg',  NULL),
(25, 'Bread/Buns',            40.00, 10.00, 'pcs', NULL),
(26, 'Canned Tuna',           15.00, 5.00, 'cans', '2026-08-31'),
(27, 'Yogurt Base',           20.00, 5.00, 'L',   '2026-06-30'),
(28, 'Fruit Puree (mixed)',   10.00, 2.00, 'kg',  '2026-07-15'),
(29, 'Carbonated Water',      40.00, 10.00, 'L',   NULL),
(30, 'Salt',                  5.00, 1.00, 'kg',   NULL);

-- ADD-ONS
INSERT INTO addOn (addOnID, ingredientID, addOnName, addOnPrice) VALUES
-- Waffle Add-ons
(1, 1,  'Whipped Cream',       25.00),
(2, 2,  'Drizzle',             15.00),
(3, 3,  'Mallows',             15.00),
(4, 4,  'Crushed Oreo',        15.00),
(5, 5,  'Fruits Jam',          25.00),
-- Drink Add-ons
(6, 6,  'Cream Cheese',        10.00),
(7, 7,  'Black Pearl',         10.00),
(8, 8,  'Nata',                10.00),
(9, 9,  'Popping Boba',        15.00),
(10,10, 'Espresso Shot',       30.00);

-- PRODUCTS
INSERT INTO product (productID, productName, productType, category, imageURL) VALUES
-- Snacks
(1,  'Siomai (5pcs)',                  'simpleProduct', 'Snacks',              NULL),
(2,  'Fries Solo',                     'flavoredItem',  'Snacks',              NULL),
(3,  'Nachos',                         'simpleProduct', 'Snacks',              NULL),
(4,  'Fries Overload',                 'flavoredItem',  'Snacks',              NULL),
(5,  'Tuna Sandwich with Fries',       'simpleProduct', 'Snacks',              NULL),
(6,  'Althea''s Burger with Fries',    'simpleProduct', 'Snacks',              NULL),
-- Sharing / Barkada Bundles
(7,  'Barkada Bundle 1',               'simpleProduct', 'Sharing',             NULL),
(8,  'Barkada Bundle 2',               'simpleProduct', 'Sharing',             NULL),
(9,  'Barkada Bundle 3',               'simpleProduct', 'Sharing',             NULL),
-- Rice Meals
(10, 'Pork Tonkatsu',                  'simpleProduct', 'Rice Meals',          NULL),
(11, 'Cordon Bleu',                    'simpleProduct', 'Rice Meals',          NULL),
(12, 'Fish Fillet',                    'simpleProduct', 'Rice Meals',          NULL),
(13, 'Burger Steak',                   'simpleProduct', 'Rice Meals',          NULL),
(14, 'Hungarian',                      'simpleProduct', 'Rice Meals',          NULL),
(15, 'Siomai Rice Meal',               'simpleProduct', 'Rice Meals',          NULL),
(16, 'Lumpia',                         'simpleProduct', 'Rice Meals',          NULL),
(17, 'Ham',                            'simpleProduct', 'Rice Meals',          NULL),
-- Extras
(18, 'Rice',                           'simpleProduct', 'Extras',              NULL),
(19, 'Egg',                            'simpleProduct', 'Extras',              NULL),
(20, 'Dip Sauce',                      'simpleProduct', 'Extras',              NULL),
-- Waffles
(21, 'Plain Waffle',                   'simpleProduct', 'Waffles',             NULL),
(22, 'Choco Chip Waffle',              'simpleProduct', 'Waffles',             NULL),
(23, 'Graham Waffle',                  'simpleProduct', 'Waffles',             NULL),
(24, 'Choco Mallows Waffle',           'simpleProduct', 'Waffles',             NULL),
(25, 'Mango Waffle',                   'simpleProduct', 'Waffles',             NULL),
(26, 'Blueberry Waffle',               'simpleProduct', 'Waffles',             NULL),
(27, 'Strawberry Waffle',              'simpleProduct', 'Waffles',             NULL),
(28, 'Oreo Overload Waffle',           'simpleProduct', 'Waffles',             NULL),
-- Milk Tea
(29, 'Wintermelon',                    'drink',         'Milk Tea',            NULL),
(30, 'Okinawa',                        'drink',         'Milk Tea',            NULL),
(31, 'Chocolate Milk Tea',             'drink',         'Milk Tea',            NULL),
(32, 'Cookies & Cream Milk Tea',       'drink',         'Milk Tea',            NULL),
(33, 'Matcha Milk Tea',                'drink',         'Milk Tea',            NULL),
(34, 'Red Velvet Milk Tea',            'drink',         'Milk Tea',            NULL),
-- Fruit Milk
(35, 'Mango Fruit Milk',               'drink',         'Fruit Milk',          NULL),
(36, 'Strawberry Fruit Milk',          'drink',         'Fruit Milk',          NULL),
(37, 'Blueberry Fruit Milk',           'drink',         'Fruit Milk',          NULL),
-- Yogurts
(38, 'Blueberry Yogurt',               'simpleProduct', 'Yogurts',             NULL),
(39, 'Strawberry Yogurt',              'simpleProduct', 'Yogurts',             NULL),
(40, 'Green Apple Yogurt',             'simpleProduct', 'Yogurts',             NULL),
-- Fruit Tea
(41, 'Sunset Vibes',                   'drink',         'Fruit Tea',           NULL),
(42, 'House Blend',                    'drink',         'Fruit Tea',           NULL),
(43, 'Signature Mix Berries',          'drink',         'Fruit Tea',           NULL),
-- Soda Pops
(44, 'Green Apple Soda',               'drink',         'Soda Pops',           NULL),
(45, 'Blueberry Soda',                 'drink',         'Soda Pops',           NULL),
(46, 'Strawberry Soda',                'drink',         'Soda Pops',           NULL),
-- Matcha Series
(47, 'Matcha Latte',                   'drink',         'Matcha Series',       NULL),
(48, 'Cloud Matcha',                   'drink',         'Matcha Series',       NULL),
(49, 'Strawberry Matcha',              'drink',         'Matcha Series',       NULL),
(50, 'Matcha Espresso',                'drink',         'Matcha Series',       NULL),
-- Juice
(51, 'Cucumber Lemonade',              'simpleProduct', 'Juice',               NULL),
-- Signature Drink
(52, 'Althea''s Milky Chocolate',      'drink',         'Signature Drink',     NULL),
-- Tea
(53, 'Jasmine Tea',                    'simpleProduct', 'Tea',                 NULL),
(54, 'English Breakfast',              'simpleProduct', 'Tea',                 NULL),
(55, 'Natural Tea',                    'simpleProduct', 'Tea',                 NULL),
-- Coffee
(56, 'Vanilla Americano',              'drink',         'Coffee',              NULL),
(57, 'Cafe Latte',                     'drink',         'Coffee',              NULL),
(58, 'Cappuccino',                     'drink',         'Coffee',              NULL),
(59, 'French Vanilla',                 'drink',         'Coffee',              NULL),
(60, 'Mocha Latte',                    'drink',         'Coffee',              NULL),
(61, 'White Choco Mocha',              'drink',         'Coffee',              NULL),
(62, 'Caramel Macchiato',              'drink',         'Coffee',              NULL),
(63, 'Salted Caramel Coffee',          'drink',         'Coffee',              NULL),
(64, 'Spanish Latte',                  'drink',         'Coffee',              NULL),
-- Coffee Based Frappe
(65, 'Java Chips',                     'drink',         'Coffee Based Frappe', NULL),
(66, 'Salted Caramel Frappe',          'drink',         'Coffee Based Frappe', NULL),
(67, 'Double Dutch',                   'drink',         'Coffee Based Frappe', NULL),
(68, 'Caramel Macchiato Frappe',       'drink',         'Coffee Based Frappe', NULL),
-- Cream Based Frappe
(69, 'Cookies & Cream Frappe',         'drink',         'Cream Based Frappe',  NULL),
(70, 'Red Velvet Frappe',              'drink',         'Cream Based Frappe',  NULL),
(71, 'Matcha Oreo Frappe',             'drink',         'Cream Based Frappe',  NULL),
(72, 'Strawberry Oreo Frappe',         'drink',         'Cream Based Frappe',  NULL),
(73, 'Matcha Strawberry Frappe',       'drink',         'Cream Based Frappe',  NULL),
(74, 'Mango Graham Frappe',            'drink',         'Cream Based Frappe',  NULL),
(75, 'Blueberry Cheesecake Frappe',    'drink',         'Cream Based Frappe',  NULL),
(76, 'Strawberry Cheesecake Frappe',   'drink',         'Cream Based Frappe',  NULL);

-- SIMPLE PRODUCTS
INSERT INTO simpleProduct (simpleProductID, productID, price) VALUES
-- Snacks
(1,  1,  39.00),   -- Siomai (5pcs)
(2,  3,  110.00),  -- Nachos
(3,  5,  130.00),  -- Tuna Sandwich with Fries
(4,  6,  135.00),  -- Althea's Burger with Fries
-- Sharing
(5,  7,  199.00),  -- Barkada Bundle 1
(6,  8,  249.00),  -- Barkada Bundle 2
(7,  9,  349.00),  -- Barkada Bundle 3
-- Rice Meals
(8,  10, 139.00),  -- Pork Tonkatsu
(9,  11, 139.00),  -- Cordon Bleu
(10, 12, 139.00),  -- Fish Fillet
(11, 13, 129.00),  -- Burger Steak
(12, 14, 119.00),  -- Hungarian
(13, 15, 119.00),  -- Siomai Rice Meal
(14, 16, 119.00),  -- Lumpia
(15, 17, 119.00),  -- Ham
-- Extras
(16, 18, 25.00),   -- Rice
(17, 19, 15.00),   -- Egg
(18, 20, 10.00),   -- Dip Sauce
-- Waffles
(19, 21, 70.00),   -- Plain Waffle
(20, 22, 99.00),   -- Choco Chip Waffle
(21, 23, 99.00),   -- Graham Waffle
(22, 24, 99.00),   -- Choco Mallows Waffle
(23, 25, 109.00),  -- Mango Waffle
(24, 26, 109.00),  -- Blueberry Waffle
(25, 27, 109.00),  -- Strawberry Waffle
(26, 28, 109.00),  -- Oreo Overload Waffle
-- Yogurts
(27, 38, 95.00),   -- Blueberry Yogurt
(28, 39, 95.00),   -- Strawberry Yogurt
(29, 40, 95.00),   -- Green Apple Yogurt
-- Juice
(30, 51, 85.00),   -- Cucumber Lemonade
-- Tea
(31, 53, 75.00),   -- Jasmine Tea
(32, 54, 75.00),   -- English Breakfast
(33, 55, 75.00);   -- Natural Tea

-- FLAVORED ITEMS
-- Fries Solo (productID 2) — Cheese / BBQ / Sour Cream
INSERT INTO flavoredItem (flavoredItemID, productID, flavorName, price) VALUES
(1,  2, 'Cheese',     79.00),
(2,  2, 'BBQ',        79.00),
(3,  2, 'Sour Cream', 79.00),
-- Fries Overload (productID 4) — same flavors
(4,  4, 'Cheese',     125.00),
(5,  4, 'BBQ',        125.00),
(6,  4, 'Sour Cream', 125.00);

-- DRINKS
INSERT INTO drink (drinkID, productID, size, price) VALUES
-- Milk Tea (16oz / 22oz)
(1,  29, '16oz', 95.00),
(2,  29, '22oz', 99.00),
(3,  30, '16oz', 95.00),
(4,  30, '22oz', 99.00),
(5,  31, '16oz', 95.00),
(6,  31, '22oz', 99.00),
(7,  32, '16oz', 95.00),
(8,  32, '22oz', 99.00),
(9,  33, '16oz', 95.00),
(10, 33, '22oz', 99.00),
(11, 34, '16oz', 95.00),
(12, 34, '22oz', 99.00),
-- Fruit Milk (16oz / 22oz)
(13, 35, '16oz', 105.00),
(14, 35, '22oz', 115.00),
(15, 36, '16oz', 105.00),
(16, 36, '22oz', 115.00),
(17, 37, '16oz', 105.00),
(18, 37, '22oz', 115.00),
-- Fruit Tea (16oz / 22oz)
(19, 41, '16oz', 95.00),
(20, 41, '22oz', 105.00),
(21, 42, '16oz', 95.00),
(22, 42, '22oz', 105.00),
(23, 43, '16oz', 90.00),
(24, 43, '22oz', 99.00),
-- Soda Pops (16oz / 22oz)
(25, 44, '16oz', 85.00),
(26, 44, '22oz', 95.00),
(27, 45, '16oz', 80.00),
(28, 45, '22oz', 90.00),
(29, 46, '16oz', 89.00),
(30, 46, '22oz', 99.00),
-- Matcha Series (16oz / 22oz)
(31, 47, '16oz', 110.00),
(32, 47, '22oz', 120.00),
(33, 48, '16oz', 115.00),
(34, 48, '22oz', 125.00),
(35, 49, '16oz', 115.00),
(36, 49, '22oz', 125.00),
(37, 50, '16oz', 120.00),
(38, 50, '22oz', 130.00),
-- Signature Drink (16oz / 22oz)
(39, 52, '16oz', 110.00),
(40, 52, '22oz', 125.00),
-- Coffee (12oz / 16oz / 22oz)
(41, 56, '12oz', 80.00),
(42, 56, '16oz', 90.00),
(43, 56, '22oz', 105.00),
(44, 57, '12oz', 99.00),
(45, 57, '16oz', 120.00),
(46, 57, '22oz', 135.00),
(47, 58, '12oz', 99.00),
(48, 58, '16oz', 120.00),
(49, 58, '22oz', 135.00),
(50, 59, '12oz', 105.00),
(51, 59, '16oz', 120.00),
(52, 59, '22oz', 135.00),
(53, 60, '12oz', 105.00),
(54, 60, '16oz', 120.00),
(55, 60, '22oz', 135.00),
(56, 61, '12oz', 115.00),
(57, 61, '16oz', 130.00),
(58, 61, '22oz', 145.00),
(59, 62, '12oz', 115.00),
(60, 62, '16oz', 130.00),
(61, 62, '22oz', 145.00),
(62, 63, '12oz', 110.00),
(63, 63, '16oz', 120.00),
(64, 63, '22oz', 135.00),
(65, 64, '12oz', 110.00),
(66, 64, '16oz', 120.00),
(67, 64, '22oz', 135.00),
-- Coffee Based Frappe (16oz / 22oz)
(68, 65, '16oz', 130.00),
(69, 65, '22oz', 140.00),
(70, 66, '16oz', 125.00),
(71, 66, '22oz', 135.00),
(72, 67, '16oz', 125.00),
(73, 67, '22oz', 135.00),
(74, 68, '16oz', 130.00),
(75, 68, '22oz', 140.00),
-- Cream Based Frappe (16oz / 22oz)
(76, 69, '16oz', 120.00),
(77, 69, '22oz', 130.00),
(78, 70, '16oz', 110.00),
(79, 70, '22oz', 120.00),
(80, 71, '16oz', 130.00),
(81, 71, '22oz', 140.00),
(82, 72, '16oz', 130.00),
(83, 72, '22oz', 140.00),
(84, 73, '16oz', 125.00),
(85, 73, '22oz', 135.00),
(86, 74, '16oz', 120.00),
(87, 74, '22oz', 130.00),
(88, 75, '16oz', 130.00),
(89, 75, '22oz', 140.00),
(90, 76, '16oz', 130.00),
(91, 76, '22oz', 140.00);

-- PRODUCT ADD-ON AVAILABILITY
-- Links which add-ons are available per product
-- Waffle add-ons available on all waffles (productIDs 21–28)
INSERT INTO productAddOn (productID, addOnID, quantityRequired) VALUES
-- Plain Waffle
(21, 1, 0.05), (21, 2, 0.02), (21, 3, 0.02), (21, 4, 0.02), (21, 5, 0.02),
-- Choco Chip Waffle
(22, 1, 0.05), (22, 2, 0.02), (22, 3, 0.02), (22, 4, 0.02), (22, 5, 0.02),
-- Graham Waffle
(23, 1, 0.05), (23, 2, 0.02), (23, 3, 0.02), (23, 4, 0.02), (23, 5, 0.02),
-- Choco Mallows Waffle
(24, 1, 0.05), (24, 2, 0.02), (24, 3, 0.02), (24, 4, 0.02), (24, 5, 0.02),
-- Mango Waffle
(25, 1, 0.05), (25, 2, 0.02), (25, 3, 0.02), (25, 4, 0.02), (25, 5, 0.02),
-- Blueberry Waffle
(26, 1, 0.05), (26, 2, 0.02), (26, 3, 0.02), (26, 4, 0.02), (26, 5, 0.02),
-- Strawberry Waffle
(27, 1, 0.05), (27, 2, 0.02), (27, 3, 0.02), (27, 4, 0.02), (27, 5, 0.02),
-- Oreo Overload Waffle
(28, 1, 0.05), (28, 2, 0.02), (28, 3, 0.02), (28, 4, 0.02), (28, 5, 0.02);

-- Drink add-ons available on all drinks
-- Milk Tea (29–34)
INSERT INTO productAddOn (productID, addOnID, quantityRequired) VALUES
(29, 6, 0.01), (29, 7, 0.01), (29, 8, 0.01), (29, 9, 0.01), (29, 10, 0.01),
(30, 6, 0.01), (30, 7, 0.01), (30, 8, 0.01), (30, 9, 0.01), (30, 10, 0.01),
(31, 6, 0.01), (31, 7, 0.01), (31, 8, 0.01), (31, 9, 0.01), (31, 10, 0.01),
(32, 6, 0.01), (32, 7, 0.01), (32, 8, 0.01), (32, 9, 0.01), (32, 10, 0.01),
(33, 6, 0.01), (33, 7, 0.01), (33, 8, 0.01), (33, 9, 0.01), (33, 10, 0.01),
(34, 6, 0.01), (34, 7, 0.01), (34, 8, 0.01), (34, 9, 0.01), (34, 10, 0.01),
-- Fruit Milk (35–37)
(35, 6, 0.01), (35, 7, 0.01), (35, 8, 0.01), (35, 9, 0.01), (35, 10, 0.01),
(36, 6, 0.01), (36, 7, 0.01), (36, 8, 0.01), (36, 9, 0.01), (36, 10, 0.01),
(37, 6, 0.01), (37, 7, 0.01), (37, 8, 0.01), (37, 9, 0.01), (37, 10, 0.01),
-- Fruit Tea (41–43)
(41, 6, 0.01), (41, 7, 0.01), (41, 8, 0.01), (41, 9, 0.01), (41, 10, 0.01),
(42, 6, 0.01), (42, 7, 0.01), (42, 8, 0.01), (42, 9, 0.01), (42, 10, 0.01),
(43, 6, 0.01), (43, 7, 0.01), (43, 8, 0.01), (43, 9, 0.01), (43, 10, 0.01),
-- Soda Pops (44–46)
(44, 6, 0.01), (44, 7, 0.01), (44, 8, 0.01), (44, 9, 0.01), (44, 10, 0.01),
(45, 6, 0.01), (45, 7, 0.01), (45, 8, 0.01), (45, 9, 0.01), (45, 10, 0.01),
(46, 6, 0.01), (46, 7, 0.01), (46, 8, 0.01), (46, 9, 0.01), (46, 10, 0.01),
-- Matcha Series (47–50)
(47, 6, 0.01), (47, 7, 0.01), (47, 8, 0.01), (47, 9, 0.01), (47, 10, 0.01),
(48, 6, 0.01), (48, 7, 0.01), (48, 8, 0.01), (48, 9, 0.01), (48, 10, 0.01),
(49, 6, 0.01), (49, 7, 0.01), (49, 8, 0.01), (49, 9, 0.01), (49, 10, 0.01),
(50, 6, 0.01), (50, 7, 0.01), (50, 8, 0.01), (50, 9, 0.01), (50, 10, 0.01),
-- Signature Drink (52)
(52, 6, 0.01), (52, 7, 0.01), (52, 8, 0.01), (52, 9, 0.01), (52, 10, 0.01),
-- Coffee (56–64)
(56, 6, 0.01), (56, 7, 0.01), (56, 8, 0.01), (56, 9, 0.01), (56, 10, 0.01),
(57, 6, 0.01), (57, 7, 0.01), (57, 8, 0.01), (57, 9, 0.01), (57, 10, 0.01),
(58, 6, 0.01), (58, 7, 0.01), (58, 8, 0.01), (58, 9, 0.01), (58, 10, 0.01),
(59, 6, 0.01), (59, 7, 0.01), (59, 8, 0.01), (59, 9, 0.01), (59, 10, 0.01),
(60, 6, 0.01), (60, 7, 0.01), (60, 8, 0.01), (60, 9, 0.01), (60, 10, 0.01),
(61, 6, 0.01), (61, 7, 0.01), (61, 8, 0.01), (61, 9, 0.01), (61, 10, 0.01),
(62, 6, 0.01), (62, 7, 0.01), (62, 8, 0.01), (62, 9, 0.01), (62, 10, 0.01),
(63, 6, 0.01), (63, 7, 0.01), (63, 8, 0.01), (63, 9, 0.01), (63, 10, 0.01),
(64, 6, 0.01), (64, 7, 0.01), (64, 8, 0.01), (64, 9, 0.01), (64, 10, 0.01),
-- Coffee Based Frappe (65–68)
(65, 6, 0.01), (65, 7, 0.01), (65, 8, 0.01), (65, 9, 0.01), (65, 10, 0.01),
(66, 6, 0.01), (66, 7, 0.01), (66, 8, 0.01), (66, 9, 0.01), (66, 10, 0.01),
(67, 6, 0.01), (67, 7, 0.01), (67, 8, 0.01), (67, 9, 0.01), (67, 10, 0.01),
(68, 6, 0.01), (68, 7, 0.01), (68, 8, 0.01), (68, 9, 0.01), (68, 10, 0.01),
-- Cream Based Frappe (69–76)
(69, 6, 0.01), (69, 7, 0.01), (69, 8, 0.01), (69, 9, 0.01), (69, 10, 0.01),
(70, 6, 0.01), (70, 7, 0.01), (70, 8, 0.01), (70, 9, 0.01), (70, 10, 0.01),
(71, 6, 0.01), (71, 7, 0.01), (71, 8, 0.01), (71, 9, 0.01), (71, 10, 0.01),
(72, 6, 0.01), (72, 7, 0.01), (72, 8, 0.01), (72, 9, 0.01), (72, 10, 0.01),
(73, 6, 0.01), (73, 7, 0.01), (73, 8, 0.01), (73, 9, 0.01), (73, 10, 0.01),
(74, 6, 0.01), (74, 7, 0.01), (74, 8, 0.01), (74, 9, 0.01), (74, 10, 0.01),
(75, 6, 0.01), (75, 7, 0.01), (75, 8, 0.01), (75, 9, 0.01), (75, 10, 0.01),
(76, 6, 0.01), (76, 7, 0.01), (76, 8, 0.01), (76, 9, 0.01), (76, 10, 0.01);

-- PRODUCT INGREDIENT MAPPINGS
INSERT INTO productIngredient (productID, ingredientID, quantityRequired) VALUES
-- SNACKS
-- Siomai (1) - Flour, Meat, Oil, Eggs
(1, 11, 0.15),  -- Flour
(1, 17, 0.25),  -- Chicken Meat
(1, 23, 0.05),  -- Oil
(1, 12, 0.10),  -- Eggs
-- Fries Solo (2) - Potatoes, Oil, Salt
(2, 24, 0.30),  -- Potatoes
(2, 23, 0.10),  -- Oil
(2, 30, 0.02),  -- Salt
-- Nachos (3) - Flour, Oil, Salt
(3, 11, 0.20),  -- Flour
(3, 23, 0.15),  -- Oil
(3, 30, 0.03),  -- Salt
-- Fries Overload (4) - Potatoes, Oil, Salt
(4, 24, 0.50),  -- Potatoes
(4, 23, 0.15),  -- Oil
(4, 30, 0.03),  -- Salt
-- Tuna Sandwich (5) - Bread, Tuna, Oil, Potatoes
(5, 25, 2.00),  -- Bread/Buns (2 pcs)
(5, 26, 0.15),  -- Canned Tuna
(5, 23, 0.08),  -- Oil (for fries)
(5, 24, 0.25),  -- Potatoes
-- Althea's Burger (6) - Bread, Beef, Potatoes, Oil
(6, 25, 1.00),  -- Bread/Buns
(6, 19, 0.20),  -- Beef
(6, 24, 0.25),  -- Potatoes
(6, 23, 0.08),  -- Oil
-- SHARING BUNDLES
-- Barkada Bundle 1 (7)
(7, 15, 1.50),  -- White Rice
(7, 17, 1.00),  -- Chicken
(7, 23, 0.20),  -- Oil
-- Barkada Bundle 2 (8)
(8, 15, 2.00),  -- White Rice
(8, 16, 0.80),  -- Pork
(8, 17, 0.80),  -- Chicken
(8, 23, 0.25),  -- Oil
-- Barkada Bundle 3 (9)
(9, 15, 2.50),  -- White Rice
(9, 16, 1.00),  -- Pork
(9, 17, 1.00),  -- Chicken
(9, 19, 0.50),  -- Beef
(9, 23, 0.30),  -- Oil
-- RICE MEALS
-- Pork Tonkatsu (10)
(10, 15, 0.80),  -- White Rice
(10, 16, 0.30),  -- Pork Meat
(10, 23, 0.10),  -- Oil
(10, 11, 0.10),  -- Flour (breading)
(10, 12, 0.05),  -- Eggs
-- Cordon Bleu (11)
(11, 15, 0.80),  -- White Rice
(11, 17, 0.30),  -- Chicken Meat
(11, 23, 0.10),  -- Oil
(11, 11, 0.10),  -- Flour
(11, 12, 0.05),  -- Eggs
-- Fish Fillet (12)
(12, 15, 0.80),  -- White Rice
(12, 18, 0.30),  -- Fish Fillet
(12, 23, 0.10),  -- Oil
(12, 11, 0.10),  -- Flour
(12, 12, 0.05),  -- Eggs
-- Burger Steak (13)
(13, 15, 0.80),  -- White Rice
(13, 19, 0.35),  -- Beef
(13, 23, 0.08),  -- Oil
-- Hungarian (14)
(14, 15, 0.80),  -- White Rice
(14, 19, 0.30),  -- Beef
(14, 23, 0.08),  -- Oil
-- Siomai Rice Meal (15)
(15, 15, 0.80),  -- White Rice
(15, 17, 0.25),  -- Chicken
(15, 23, 0.08),  -- Oil
(15, 11, 0.10),  -- Flour
(15, 12, 0.08),  -- Eggs
-- Lumpia (16)
(16, 15, 0.80),  -- White Rice
(16, 16, 0.25),  -- Pork
(16, 23, 0.10),  -- Oil (frying)
(16, 11, 0.08),  -- Flour
-- Ham (17)
(17, 15, 0.80),  -- White Rice
(17, 16, 0.30),  -- Pork
(17, 23, 0.08),  -- Oil
-- EXTRAS
(18, 15, 0.80),  -- Rice
(19, 12, 1.00),  -- Eggs
(20, 23, 0.02),  -- Oil (for sauce base)
-- WAFFLES
-- Plain Waffle (21)
(21, 11, 0.25),  -- Flour
(21, 12, 0.15),  -- Eggs
(21, 14, 0.10),  -- Sugar
(21, 13, 0.08),  -- Butter
(21, 20, 0.10),  -- Milk
-- Choco Chip Waffle (22)
(22, 11, 0.25),  -- Flour
(22, 12, 0.15),  -- Eggs
(22, 14, 0.12),  -- Sugar
(22, 13, 0.08),  -- Butter
(22, 20, 0.10),  -- Milk
-- Graham Waffle (23)
(23, 11, 0.25),  -- Flour
(23, 12, 0.15),  -- Eggs
(23, 14, 0.12),  -- Sugar
(23, 13, 0.08),  -- Butter
(23, 20, 0.10),  -- Milk
-- Choco Mallows Waffle (24)
(24, 11, 0.25),  -- Flour
(24, 12, 0.15),  -- Eggs
(24, 14, 0.15),  -- Sugar
(24, 13, 0.08),  -- Butter
(24, 20, 0.10),  -- Milk
-- Mango Waffle (25)
(25, 11, 0.25),  -- Flour
(25, 12, 0.15),  -- Eggs
(25, 14, 0.12),  -- Sugar
(25, 13, 0.08),  -- Butter
(25, 20, 0.10),  -- Milk
-- Blueberry Waffle (26)
(26, 11, 0.25),  -- Flour
(26, 12, 0.15),  -- Eggs
(26, 14, 0.12),  -- Sugar
(26, 13, 0.08),  -- Butter
(26, 20, 0.10),  -- Milk
-- Strawberry Waffle (27)
(27, 11, 0.25),  -- Flour
(27, 12, 0.15),  -- Eggs
(27, 14, 0.12),  -- Sugar
(27, 13, 0.08),  -- Butter
(27, 20, 0.10),  -- Milk
-- Oreo Overload Waffle (28)
(28, 11, 0.25),  -- Flour
(28, 12, 0.15),  -- Eggs
(28, 14, 0.15),  -- Sugar
(28, 13, 0.08),  -- Butter
(28, 20, 0.10),  -- Milk
-- MILK TEA DRINKS (29-34)
(29, 20, 0.20),  -- Milk (Wintermelon)
(29, 21, 0.05),  -- Tea Leaves
(29, 14, 0.04),  -- Sugar
(30, 20, 0.20),  -- Milk (Okinawa)
(30, 21, 0.05),  -- Tea Leaves
(30, 14, 0.04),  -- Sugar
(31, 20, 0.20),  -- Milk (Chocolate)
(31, 21, 0.05),  -- Tea Leaves
(31, 14, 0.06),  -- Sugar (higher for chocolate)
(32, 20, 0.20),  -- Milk (Cookies & Cream)
(32, 21, 0.05),  -- Tea Leaves
(32, 14, 0.05),  -- Sugar
(33, 20, 0.20),  -- Milk (Matcha)
(33, 21, 0.05),  -- Tea Leaves
(33, 14, 0.05),  -- Sugar
(34, 20, 0.20),  -- Milk (Red Velvet)
(34, 21, 0.05),  -- Tea Leaves
(34, 14, 0.06),  -- Sugar
-- FRUIT MILK (35-37)
(35, 20, 0.18),  -- Milk (Mango)
(35, 28, 0.08),  -- Fruit Puree
(35, 14, 0.04),  -- Sugar
(36, 20, 0.18),  -- Milk (Strawberry)
(36, 28, 0.08),  -- Fruit Puree
(36, 14, 0.04),  -- Sugar
(37, 20, 0.18),  -- Milk (Blueberry)
(37, 28, 0.08),  -- Fruit Puree
(37, 14, 0.04),  -- Sugar
-- YOGURTS (38-40)
(38, 27, 0.25),  -- Yogurt Base (Blueberry)
(38, 28, 0.05),  -- Fruit Puree
(38, 14, 0.02),  -- Sugar
(39, 27, 0.25),  -- Yogurt Base (Strawberry)
(39, 28, 0.05),  -- Fruit Puree
(39, 14, 0.02),  -- Sugar
(40, 27, 0.25),  -- Yogurt Base (Green Apple)
(40, 28, 0.05),  -- Fruit Puree
(40, 14, 0.02),  -- Sugar
-- FRUIT TEA (41-43)
(41, 21, 0.05),  -- Tea Leaves (Sunset Vibes)
(41, 28, 0.08),  -- Fruit Puree
(41, 14, 0.04),  -- Sugar
(42, 21, 0.05),  -- Tea Leaves (House Blend)
(42, 28, 0.08),  -- Fruit Puree
(42, 14, 0.04),  -- Sugar
(43, 21, 0.06),  -- Tea Leaves (Signature Mix Berries)
(43, 28, 0.10),  -- Fruit Puree
(43, 14, 0.04),  -- Sugar
-- SODA POPS (44-46)
(44, 29, 0.20),  -- Carbonated Water (Green Apple)
(44, 28, 0.06),  -- Fruit Puree
(44, 14, 0.04),  -- Sugar
(45, 29, 0.20),  -- Carbonated Water (Blueberry)
(45, 28, 0.06),  -- Fruit Puree
(45, 14, 0.04),  -- Sugar
(46, 29, 0.20),  -- Carbonated Water (Strawberry)
(46, 28, 0.06),  -- Fruit Puree
(46, 14, 0.04),  -- Sugar
-- MATCHA SERIES (47-50)
(47, 20, 0.18),  -- Milk (Matcha Latte)
(47, 21, 0.06),  -- Tea Leaves (Matcha)
(47, 14, 0.05),  -- Sugar
(48, 20, 0.18),  -- Milk (Cloud Matcha)
(48, 21, 0.06),  -- Tea Leaves (Matcha)
(48, 14, 0.06),  -- Sugar
(49, 20, 0.18),  -- Milk (Strawberry Matcha)
(49, 21, 0.06),  -- Tea Leaves (Matcha)
(49, 14, 0.06),  -- Sugar
(50, 20, 0.15),  -- Milk (Matcha Espresso)
(50, 22, 0.03),  -- Coffee Beans (for espresso)
(50, 21, 0.05),  -- Tea Leaves (Matcha)
(50, 14, 0.05),  -- Sugar
-- JUICE (51)
(51, 28, 0.15),  -- Fruit Puree (Cucumber Lemonade)
(51, 29, 0.15),  -- Carbonated Water
(51, 14, 0.05),  -- Sugar
-- SIGNATURE DRINK (52)
(52, 20, 0.20),  -- Milk (Althea's Milky Chocolate)
(52, 22, 0.03),  -- Coffee Beans
(52, 14, 0.08),  -- Sugar
-- TEA (53-55)
(53, 21, 0.04),  -- Tea Leaves (Jasmine)
(53, 20, 0.10),  -- Milk
(53, 14, 0.02),  -- Sugar
(54, 21, 0.04),  -- Tea Leaves (English Breakfast)
(54, 20, 0.10),  -- Milk
(54, 14, 0.02),  -- Sugar
(55, 21, 0.04),  -- Tea Leaves (Natural)
(55, 20, 0.10),  -- Milk
(55, 14, 0.02),  -- Sugar
-- COFFEE (56-64)
(56, 22, 0.04),  -- Coffee Beans (Vanilla Americano)
(56, 14, 0.03),  -- Sugar
(57, 22, 0.04),  -- Coffee Beans (Cafe Latte)
(57, 20, 0.15),  -- Milk
(57, 14, 0.03),  -- Sugar
(58, 22, 0.04),  -- Coffee Beans (Cappuccino)
(58, 20, 0.12),  -- Milk
(58, 14, 0.03),  -- Sugar
(59, 22, 0.04),  -- Coffee Beans (French Vanilla)
(59, 20, 0.15),  -- Milk
(59, 14, 0.04),  -- Sugar
(60, 22, 0.04),  -- Coffee Beans (Mocha Latte)
(60, 20, 0.15),  -- Milk
(60, 14, 0.05),  -- Sugar
(61, 22, 0.04),  -- Coffee Beans (White Choco Mocha)
(61, 20, 0.15),  -- Milk
(61, 14, 0.06),  -- Sugar
(62, 22, 0.04),  -- Coffee Beans (Caramel Macchiato)
(62, 20, 0.12),  -- Milk
(62, 14, 0.05),  -- Sugar
(63, 22, 0.04),  -- Coffee Beans (Salted Caramel)
(63, 14, 0.05),  -- Sugar
(64, 22, 0.04),  -- Coffee Beans (Spanish Latte)
(64, 20, 0.15),  -- Milk
(64, 14, 0.04),  -- Sugar
-- COFFEE BASED FRAPPE (65-68)
(65, 22, 0.05),  -- Coffee Beans (Java Chips)
(65, 20, 0.18),  -- Milk
(65, 14, 0.06),  -- Sugar
(66, 22, 0.05),  -- Coffee Beans (Salted Caramel Frappe)
(66, 20, 0.18),  -- Milk
(66, 14, 0.07),  -- Sugar
(67, 22, 0.05),  -- Coffee Beans (Double Dutch)
(67, 20, 0.18),  -- Milk
(67, 14, 0.07),  -- Sugar
(68, 22, 0.05),  -- Coffee Beans (Caramel Macchiato Frappe)
(68, 20, 0.18),  -- Milk
(68, 14, 0.06),  -- Sugar
-- CREAM BASED FRAPPE (69-76)
(69, 20, 0.20),  -- Milk (Cookies & Cream Frappe)
(69, 14, 0.06),  -- Sugar
(70, 20, 0.20),  -- Milk (Red Velvet Frappe)
(70, 14, 0.06),  -- Sugar
(71, 20, 0.20),  -- Milk (Matcha Oreo Frappe)
(71, 21, 0.04),  -- Tea Leaves (Matcha)
(71, 14, 0.06),  -- Sugar
(72, 20, 0.20),  -- Milk (Strawberry Oreo Frappe)
(72, 28, 0.06),  -- Fruit Puree
(72, 14, 0.05),  -- Sugar
(73, 20, 0.20),  -- Milk (Matcha Strawberry Frappe)
(73, 21, 0.04),  -- Tea Leaves (Matcha)
(73, 28, 0.06),  -- Fruit Puree
(73, 14, 0.05),  -- Sugar
(74, 20, 0.20),  -- Milk (Mango Graham Frappe)
(74, 28, 0.08),  -- Fruit Puree
(74, 14, 0.05),  -- Sugar
(75, 20, 0.20),  -- Milk (Blueberry Cheesecake Frappe)
(75, 28, 0.08),  -- Fruit Puree
(75, 14, 0.05),  -- Sugar
(76, 20, 0.20),  -- Milk (Strawberry Cheesecake Frappe)
(76, 28, 0.08),  -- Fruit Puree
(76, 14, 0.05);  -- Sugar

-- ORDERS (12 realistic orders across 3 days)
INSERT INTO orders (orderID, accountID, dateAndTime, discountPercent, taxAmount, paymentMethod) VALUES
(1,  2, '2025-03-01 09:15:00', 0.00,  0.00, 'Cash'),
(2,  2, '2025-03-01 10:42:00', 0.00,  0.00, 'Cash'),
(3,  2, '2025-03-01 12:05:00', 10.00, 0.00, 'GCash'),
(4,  2, '2025-03-01 14:30:00', 0.00,  0.00, 'Cash'),
(5,  3, '2025-03-01 16:55:00', 0.00,  0.00, 'Cash'),
(6,  3, '2025-03-02 09:30:00', 0.00,  0.00, 'Cash'),
(7,  3, '2025-03-02 11:20:00', 5.00,  0.00, 'Credit Card'),
(8,  3, '2025-03-02 13:10:00', 0.00,  0.00, 'GCash'),
(9,  2, '2025-03-02 15:45:00', 0.00,  0.00, 'Cash'),
(10, 2, '2025-03-02 17:30:00', 0.00,  0.00, 'Cash'),
(11, 1, '2025-03-03 10:00:00', 0.00,  0.00, 'Cash'),
(12, 3, '2025-03-03 13:45:00', 15.00, 0.00, 'Credit Card');

-- ORDER ITEMS
INSERT INTO orderItem (orderItemID, orderID, productID, productPriceAtTime, lineTotal, productQuantity) VALUES
-- Order 1: Siomai (5pcs) + Caramel Macchiato 16oz
(1,  1,  1,  39.00,  39.00,  1),
(2,  1,  62, 130.00, 130.00, 1),
-- Order 2: Burger Steak + extra Egg + Wintermelon 22oz
(3,  2,  13, 129.00, 129.00, 1),
(4,  2,  19, 15.00,  15.00,  1),
(5,  2,  29, 99.00,  99.00,  1),
-- Order 3: Barkada Bundle 2 + 2x Okinawa 16oz
(6,  3,  8,  249.00, 249.00, 1),
(7,  3,  30, 95.00,  190.00, 2),
-- Order 4: Choco Chip Waffle + Blueberry Waffle + Java Chips 16oz + Mango Graham Frappe 16oz
(8,  4,  22, 99.00,  99.00,  1),
(9,  4,  26, 109.00, 109.00, 1),
(10, 4,  65, 130.00, 130.00, 1),
(11, 4,  74, 120.00, 120.00, 1),
-- Order 5: Fries Solo (Cheese) + Nachos + 2x Mango Fruit Milk 16oz
(12, 5,  2,  79.00,  79.00,  1),
(13, 5,  3,  110.00, 110.00, 1),
(14, 5,  35, 105.00, 210.00, 2),
-- Order 6: Cafe Latte 12oz + Plain Waffle
(15, 6,  57, 99.00,  99.00,  1),
(16, 6,  21, 70.00,  70.00,  1),
-- Order 7: 2x Pork Tonkatsu + 2x Rice + Cucumber Lemonade
(17, 7,  10, 139.00, 278.00, 2),
(18, 7,  18, 25.00,  50.00,  2),
(19, 7,  51, 85.00,  85.00,  1),
-- Order 8: Matcha Oreo Frappe 22oz + Graham Waffle
(20, 8,  71, 140.00, 140.00, 1),
(21, 8,  23, 99.00,  99.00,  1),
-- Order 9: Fries Overload (BBQ) + Blueberry Soda 22oz + Green Apple Soda 16oz
(22, 9,  4,  125.00, 125.00, 1),
(23, 9,  45, 90.00,  90.00,  1),
(24, 9,  44, 85.00,  85.00,  1),
-- Order 10: Jasmine Tea + English Breakfast + Oreo Overload Waffle
(25, 10, 53, 75.00,  75.00,  1),
(26, 10, 54, 75.00,  75.00,  1),
(27, 10, 28, 109.00, 109.00, 1),
-- Order 11: Spanish Latte 16oz + Strawberry Matcha 22oz + Tuna Sandwich
(28, 11, 64, 120.00, 120.00, 1),
(29, 11, 49, 125.00, 125.00, 1),
(30, 11, 5,  130.00, 130.00, 1),
-- Order 12: Barkada Bundle 3 + 3x Sunset Vibes 16oz + 2x Signature Mix Berries 16oz
(31, 12, 9,  349.00, 349.00, 1),
(32, 12, 41, 95.00,  285.00, 3),
(33, 12, 43, 90.00,  180.00, 2);

-- BRIDGE: orderItemDrink
INSERT INTO orderItemDrink (orderItemDrinkID, orderItemID, drinkID) VALUES
(1,  2,  60),
(2,  5,  2),
(3,  7,  3),
(4,  10, 68),
(5,  11, 86),
(6,  14, 13),
(7,  15, 44),
(8,  20, 81),
(9,  23, 28),
(10, 24, 25),
(11, 28, 66),
(12, 29, 36),
(13, 32, 19),
(14, 33, 23);

-- BRIDGE: orderItemSimpleProduct
INSERT INTO orderItemSimpleProduct (orderItemSimpleProductID, orderItemID, simpleProductID) VALUES
(1,  1,  1),
(2,  3,  11),
(3,  4,  17),
(4,  6,  6),
(5,  8,  20),
(6,  9,  24),
(7,  13, 2),
(8,  16, 19),
(9,  17, 8),
(10, 18, 16),
(11, 19, 30),
(12, 21, 21),
(13, 25, 31),
(14, 26, 32),
(15, 27, 26),
(16, 30, 3),
(17, 31, 7);

-- BRIDGE: orderItemFlavoredItem
INSERT INTO orderItemFlavoredItem (orderItemFlavoredItemID, orderItemID, flavoredItemID) VALUES
(1, 12, 1),
(2, 22, 5);

-- ORDER ITEM ADD-ONS
INSERT INTO orderItemAddOn (orderItemAddOnID, orderItemID, addOnID, addOnPriceAtTime, addOnQuantity) VALUES
-- Order 1: Caramel Macchiato + Cream Cheese + Black Pearl
(1,  2,  6,  10.00, 1),
(2,  2,  7,  10.00, 1),
-- Order 2: Wintermelon 22oz + Popping Boba
(3,  5,  9,  15.00, 1),
-- Order 3: Okinawa 16oz x2 + Nata
(4,  7,  8,  10.00, 1),
-- Order 4: Choco Chip Waffle + Whipped Cream + Drizzle
(5,  8,  1,  25.00, 1),
(6,  8,  2,  15.00, 1),
-- Order 4: Blueberry Waffle + Whipped Cream + Fruits Jam
(7,  9,  1,  25.00, 1),
(8,  9,  5,  25.00, 1),
-- Order 4: Java Chips 16oz + Espresso Shot
(9,  10, 10, 30.00, 1),
-- Order 8: Matcha Oreo Frappe 22oz + Cream Cheese
(10, 20, 6,  10.00, 1),
-- Order 8: Graham Waffle + Whipped Cream + Mallows
(11, 21, 1,  25.00, 1),
(12, 21, 3,  15.00, 1),
-- Order 10: Oreo Overload Waffle + Crushed Oreo + Whipped Cream
(13, 27, 4,  15.00, 1),
(14, 27, 1,  25.00, 1),
-- Order 11: Spanish Latte 16oz + Espresso Shot
(15, 28, 10, 30.00, 1),
-- Order 12: Sunset Vibes 16oz x3 + Black Pearl x3
(16, 32, 7,  10.00, 3),
-- Order 12: Signature Mix Berries 16oz x2 + Popping Boba x2
(17, 33, 9,  15.00, 2);
