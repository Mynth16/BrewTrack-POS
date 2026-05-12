# POS Page Explanation: Data Flow and State Management

## Overview

The POS (Point of Sale) page is the core transaction interface for BrewTrack. It allows staff to browse products, build shopping carts, apply discounts, and process payments. The page demonstrates a clean separation between **local component state** (for UI and product data) and **shared application state** (for cart management), with data persistence through localStorage.

### Main Responsibilities

1. **Product Discovery** — Display products with search and category filtering
2. **Cart Management** — Allow adding, removing, and modifying items
3. **Transaction Calculation** — Compute subtotals, discounts, and final totals in real-time
4. **Checkout Orchestration** — Coordinate the multi-step payment and order submission process

---

## Architecture Overview

### Component Hierarchy

```
Pos (main container)
├── Navigation (header)
├── LoadingSpinner (loading state)
├── Product Section
│   ├── Search Input → [searchQuery state]
│   ├── Category Buttons → [selectedCategory state]
│   ├── Add Feedback Toast → [showAddFeedback state]
│   └── ProductCard Grid
│       └── ProductCard (individual item)
│           └── triggers: handleAddToCart(product, quantity, size)
│
└── Checkout Sidebar
    ├── Checkout Header
    │   └── Displays: cartItems.length
    ├── CartItemRow List
    │   ├── Displays: item quantity, add-ons
    │   └── Triggers: removeFromCart, updateQuantity, toggleAddOn
    ├── Checkout Summary
    │   ├── Displays: totals (subtotal, discount, total)
    │   └── Input: discountPercent (updates via setDiscountPercent)
    ├── Checkout Actions Button
    │   └── Triggers: handleOpenPaymentModal
    ├── Payment Modal (conditional)
    │   └── Triggers: onPaymentComplete(order)
    └── Receipt Modal (conditional)
        └── Displays: completed order details
```

### Context Dependencies

- **CartContext** — Manages cart state and totals across the entire app
- **AuthContext** — Provides auth token needed for API calls (passed to CartContext.submitOrder)

---

## State Management Architecture

### 1. Pos.jsx Component Local State

The Pos component manages **product data** and **UI state** locally. This state is NOT shared across other pages.

```javascript
// Product Data State
const [products, setProducts] = useState([]);          // All products from API
const [categories, setCategories] = useState([]);      // All categories from API
const [addOns, setAddOns] = useState([]);              // All add-ons available
const [loading, setLoading] = useState(true);          // Loading flag
const [error, setError] = useState(null);              // Error message

// UI State
const [selectedCategory, setSelectedCategory] = useState(null);      // Filter: active category
const [searchQuery, setSearchQuery] = useState('');                  // Filter: search text
const [showAddFeedback, setShowAddFeedback] = useState(false);       // Toast: show/hide
const [addFeedbackText, setAddFeedbackText] = useState('');         // Toast: message text

// Payment/Receipt State
const [showPaymentModal, setShowPaymentModal] = useState(false);     // Modal: payment open?
const [showReceipt, setShowReceipt] = useState(false);               // Modal: receipt open?
const [orderData, setOrderData] = useState(null);                   // Modal: completed order details
```

**Key Insight**: These states are scoped to Pos.jsx. If you navigate away from the Pos page and come back, this state resets. Only CartContext state persists.

---

### 2. CartContext Shared State

CartContext manages the **shopping cart** globally and **persists it** to localStorage. This is shared across all pages in the app.

```javascript
// Cart Global State
const [cartItems, setCartItems] = useState([]);         // Array of items in cart
const [discountPercent, setDiscountPercent] = useState(0);  // Discount percentage (0-100)

// Derived State (computed from above)
const totals = {
  subtotal: number,              // Sum of all items + add-ons
  discountAmount: number,        // (subtotal × discountPercent) / 100
  subtotalAfterDiscount: number, // subtotal - discountAmount
  total: number,                 // Final amount to pay
}
```

#### localStorage Persistence

CartContext saves and loads data from localStorage under the key `brewtrack_cart`:

```javascript
// On Component Mount (initialization)
useEffect(() => {
  const savedCart = localStorage.getItem('brewtrack_cart');
  if (savedCart) {
    const { items, discount } = JSON.parse(savedCart);
    setCartItems(items);
    setDiscountPercent(discount);
  }
}, []);  // Runs ONCE when CartProvider mounts

// On Every Change (persistence)
useEffect(() => {
  const cartData = { items: cartItems, discount: discountPercent };
  localStorage.setItem('brewtrack_cart', JSON.stringify(cartData));
}, [cartItems, discountPercent]);  // Runs EVERY TIME cart changes
```

**Impact**: If a user closes the browser and reopens it, their cart is still there (as long as localStorage isn't cleared). If they navigate to another page and come back to Pos, the cart persists.

---

### 3. Cart Item Structure

Each item added to the cart has this structure:

```javascript
{
  id: "5_Large_1715432890123_0.456",  // Unique ID per cart item (includes timestamp)
  productId: 5,                        // Reference to product in product list
  productName: "Iced Coffee",          // Product name (denormalized for display)
  size: "Large",                       // Size selected (e.g., "Small", "Medium", "Large")
  price: 95.00,                        // Price of size (locked at time of add)
  quantity: 2,                         // How many of this exact item
  addOns: [                            // Array of selected add-ons for this item
    { id: 12, name: "Extra Shot", price: 20 },
    { id: 15, name: "Honey", price: 15 }
  ],
  image: "url_or_path",               // Product image for display
}
```

**Key Design Choice**: Adding the same product with the same size **does NOT merge items**. Instead, a new cart item is created with `quantity: 1`. To increase quantity, users modify the `quantity` field via the quantity +/- buttons. This allows independent management of add-ons per "transaction unit."

---

## Data Flow Walkthrough

### Flow 1: Product Loading (Page Initialization)

**When**: Component mounts (first page load)  
**Trigger**: `useEffect` with empty dependency array

```
1. Pos.jsx mounts
   └─ setLoading(true)

2. fetchProducts() async function runs
   ├─ Calls: productService.getProducts()
   │  └─ GET http://localhost:3000/api/products
   │     └─ No authentication needed (public data)
   │
   └─ Response: { categories, products, addOns }

3. Update local state with fetched data
   ├─ setCategories(data.categories)
   ├─ setProducts(data.products)
   ├─ setAddOns(data.addOns)
   ├─ setError(null)
   └─ setLoading(false)

4. Conditional rendering
   ├─ IF loading = true  → Show LoadingSpinner
   ├─ IF error exists    → Show error message
   └─ IF loaded          → Show ProductCard grid

Result: Product grid displays all items or filtered items
```

---

### Flow 2: Add to Cart

**When**: User clicks "Add to Cart" on ProductCard  
**Trigger**: ProductCard calls `onAddToCart(product, quantity, size)`

```
1. User clicks "Add" button on ProductCard
   ├─ ProductCard captures selected size from dropdown
   ├─ Calls: handleAddToCart(product, 1, "Large")
   └─ [Local to Pos.jsx]

2. handleAddToCart() executes
   ├─ addToCart(product, 1, "Large")  [Call CartContext method]
   ├─ setAddFeedbackText("...")
   ├─ setShowAddFeedback(true)
   └─ setTimeout → setShowAddFeedback(false) after 2 seconds

3. CartContext.addToCart() executes
   ├─ Find price from product.sizes array matching "Large"
   ├─ Generate unique ID: `${productId}_${size}_${timestamp}_${random}`
   ├─ Create new item object:
   │  {
   │    id: "5_Large_1715432890123_0.456",
   │    productId: 5,
   │    productName: product.name,
   │    size: "Large",
   │    price: 95.00,
   │    quantity: 1,
   │    addOns: [],
   │    image: product.image,
   │  }
   │
   └─ setCartItems(prevItems => [...prevItems, newItem])

4. CartContext useEffect detects cartItems change
   ├─ Calls: localStorage.setItem('brewtrack_cart', JSON.stringify({ items, discount }))
   └─ [Cart now persisted to browser storage]

5. Components that consume CartContext re-render
   ├─ Pos.jsx (via useCart hook)
   │  ├─ cartItems updated
   │  └─ Checkout section re-renders showing new item
   │
   └─ CartItemRow appears in the cart list

Result: New item appears in checkout sidebar; toast notification shows; localStorage updated
```

---

### Flow 3: Modify Cart (Quantity, Add-ons, Discount)

#### 3A: Update Quantity

**When**: User clicks +/- button on CartItemRow  
**Trigger**: CartItemRow calls `onUpdateQty(itemId, newQty)`

```
1. User clicks "+" or "−" button next to quantity
   ├─ Calls: updateQuantity(item.id, currentQty + 1)
   └─ [Local to CartItemRow]

2. CartContext.updateQuantity(itemId, newQuantity) executes
   ├─ IF newQuantity ≤ 0
   │  └─ removeFromCart(itemId)  [Delete item]
   │
   └─ ELSE
      ├─ setCartItems(prevItems =>
      │    prevItems.map(item =>
      │      item.id === itemId ? { ...item, quantity: newQuantity } : item
      │    )
      │  )
      └─ [Update specific item's quantity]

3. CartContext useEffect detects cartItems change
   └─ localStorage.setItem(...)

4. Components re-render
   ├─ cartItems updated
   ├─ totals recalculated (quantity used in price calculation)
   ├─ Checkout Summary updates (subtotal, total)
   └─ CartItemRow displays new quantity

Result: Item quantity updated; totals recalculated; localStorage persisted
```

#### 3B: Toggle Add-on

**When**: User checks/unchecks an add-on checkbox on CartItemRow  
**Trigger**: CartItemRow calls `onToggleAddOn(itemId, addOn)`

```
1. User clicks checkbox for add-on (e.g., "Extra Shot")
   ├─ Calls: toggleAddOn(item.id, { id: 12, name: "Extra Shot", price: 20 })
   └─ [Local to CartItemRow]

2. CartContext.toggleAddOn(itemId, addOn) executes
   ├─ Find the item in cartItems by itemId
   ├─ Check if addOn.id exists in item.addOns array
   │
   ├─ IF exists
   │  └─ Remove it: updatedAddOns = item.addOns.filter(...id not match)
   │
   └─ IF not exists
      └─ Add it: updatedAddOns = [...item.addOns, addOn]
   
   ├─ setCartItems(prevItems =>
   │    prevItems.map(item =>
   │      item.id === itemId ? { ...item, addOns: updatedAddOns } : item
   │    )
   │  )
   └─ [Update specific item's add-ons]

3. CartContext useEffect detects cartItems change
   └─ localStorage.setItem(...)

4. Components re-render
   ├─ cartItems updated
   ├─ totals recalculated (add-ons prices included)
   │  └─ addOnsTotal = addOn.price × item.quantity
   ├─ Checkout Summary updates (subtotal, total change)
   └─ CartItemRow checkbox reflects new state

Result: Add-on toggled; totals recalculated; localStorage persisted
```

#### 3C: Change Discount Percentage

**When**: User types new discount value in Pos checkout summary input  
**Trigger**: User types in discount input field

```
1. User changes discount input value (e.g., types "10")
   ├─ onChange event fires
   ├─ setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value))))
   └─ [Pos.jsx local state → CartContext state]

2. CartContext state updates
   └─ setDiscountPercent(10)

3. CartContext useEffect detects discountPercent change
   └─ localStorage.setItem(...)

4. Derived state (totals) recalculates
   ├─ totals.discountAmount = (subtotal × 10) / 100
   ├─ totals.subtotalAfterDiscount = subtotal - discountAmount
   └─ totals.total = subtotalAfterDiscount

5. Components re-render
   ├─ Pos.jsx accesses totals via useCart()
   ├─ Checkout Summary displays new discount, discount amount, and total
   └─ "Discount Amount" row appears/disappears based on discount > 0

Result: Discount applied; totals recalculated in real-time; localStorage persisted
```

---

### Flow 4: Payment & Order Submission (Multi-Step)

**When**: User clicks "Proceed to Payment" → Enters cash amount → Clicks "Pay Now"  
**Trigger**: handleOpenPaymentModal → Payment component → handlePayNow()

```
1. User clicks "Proceed to Payment" button
   ├─ handleOpenPaymentModal() executes [Pos.jsx]
   ├─ setShowPaymentModal(true)
   └─ Payment modal opens on screen

2. Payment modal captures user input
   ├─ User enters cash amount (e.g., 500)
   ├─ System calculates change = 500 - total
   ├─ User clicks "Pay Now" button
   └─ Payment component calls: onPaymentComplete()

3. Payment component calls CartContext.submitOrder(paymentMethod, token)
   ├─ paymentMethod: "cash" (or "card", etc.)
   ├─ token: Auth token from AuthContext / localStorage
   └─ This is an async function that orchestrates 4 API steps:

   ┌─────────────────────────────────────────────────────────┐
   │ STEP 1: Create Order (initialize order record)         │
   ├─────────────────────────────────────────────────────────┤
   │ orderService.createOrder(discountPercent, token)        │
   │ ├─ POST /api/orders                                      │
   │ ├─ Headers: Authorization: Bearer {token}               │
   │ ├─ Body: { discountPercent: 10 }                         │
   │ └─ Response: { orderId: 42 }                             │
   └─────────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────────┐
   │ STEP 2: Prepare Data for Next Steps                     │
   ├─────────────────────────────────────────────────────────┤
   │ Transform cartItems into API-ready format:              │
   │                                                          │
   │ items = [                                               │
   │   {                                                      │
   │     productId: 5,                                        │
   │     size: "Large",                                       │
   │     quantity: 2,                                         │
   │     priceAtTime: 95.00,  (locked price at time of add)  │
   │   },                                                     │
   │   ...                                                    │
   │ ]                                                        │
   │                                                          │
   │ addOns = {                                              │
   │   0: [  // Index of cartItem with add-ons               │
   │     { addOnId: 12, price: 20 },                         │
   │     { addOnId: 15, price: 15 },                         │
   │   ],                                                     │
   │ }                                                        │
   └─────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────┐
   │ STEP 3: Add Order Items (populate order with products)  │
   ├─────────────────────────────────────────────────────────┤
   │ orderService.addOrderItems(orderId, items, addOns, token)│
   │ ├─ POST /api/orders/42/items                            │
   │ ├─ Headers: Authorization: Bearer {token}               │
   │ ├─ Body: { items: [...], addOns: {...} }                │
   │ └─ Response: { itemCount: 2, addOnCount: 2 }            │
   └─────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────┐
   │ STEP 4: Complete Order (finalize & mark as paid)        │
   ├─────────────────────────────────────────────────────────┤
   │ orderService.completeOrder(orderId, paymentMethod, token)│
   │ ├─ POST /api/orders/42/complete                         │
   │ ├─ Headers: Authorization: Bearer {token}               │
   │ ├─ Body: { paymentMethod: "cash" }                       │
   │ └─ Response: Full order object                          │
   │    {                                                     │
   │      orderId: 42,                                        │
   │      timestamp: "2024-05-11 14:35:22",                   │
   │      items: [...],                                       │
   │      total: 190.00,                                      │
   │      discount: 10%,                                      │
   │      paymentMethod: "cash",                              │
   │      ...                                                 │
   │    }                                                     │
   └─────────────────────────────────────────────────────────┘

4. On Success: Clear Cart & Update UI
   ├─ CartContext.clearCart()
   │  ├─ setCartItems([])
   │  ├─ setDiscountPercent(0)
   │  └─ [localStorage clears too via useEffect]
   │
   ├─ setOrderData(orderData)  [Pass to Receipt modal]
   ├─ setShowPaymentModal(false)  [Close payment modal]
   ├─ setShowReceipt(true)  [Open receipt modal]
   └─ Receipt component displays: Order ID, items, total, timestamp

5. On Error
   ├─ Catch error in submitOrder try/catch
   ├─ Log error to console
   ├─ Throw error (Payment component handles & displays to user)
   └─ Cart remains unchanged (user can retry)

Result: Order created on backend; cart cleared; receipt displayed; next customer ready
```

---

## State Change Summary Table

| Action | State Updated | Persisted? | Components Re-render |
|--------|---------------|------------|----------------------|
| Search/filter products | `selectedCategory`, `searchQuery` | NO | ProductCard grid |
| Add to cart | `cartItems` (CartContext) | YES | CartItemRow list, totals |
| Remove from cart | `cartItems` (CartContext) | YES | CartItemRow list, totals |
| Update quantity | `cartItems[item].quantity` | YES | CartItemRow, totals |
| Toggle add-on | `cartItems[item].addOns` | YES | CartItemRow, totals |
| Change discount | `discountPercent` (CartContext) | YES | Checkout summary (totals) |
| Show/hide add feedback | `showAddFeedback` | NO | Toast notification |
| Open payment modal | `showPaymentModal` | NO | Modal overlay |
| Submit order | `cartItems`, `discountPercent` cleared | YES | Cart resets, receipt shown |

---

## API Integration

The Pos page integrates with the backend through three main service functions:

### productService.getProducts()

**Purpose**: Load product catalog  
**Called**: On Pos component mount (useEffect)  
**Endpoint**: `GET /api/products`  
**Authentication**: None required (public data)  
**Response**:
```javascript
{
  data: {
    categories: [
      { categoryID: 1, categoryName: "Coffee" },
      { categoryID: 2, categoryName: "Tea" },
      ...
    ],
    products: [
      {
        productID: 5,
        name: "Iced Coffee",
        description: "Cold brew coffee",
        price: 85,  // Base price
        sizes: [
          { label: "Small", price: 85 },
          { label: "Large", price: 95 },
        ],
        categoryID: 1,
        image: "url",
        addOns: [
          { id: 12, name: "Extra Shot", price: 20 },
          { id: 15, name: "Honey", price: 15 },
        ],
        inStock: true,
      },
      ...
    ],
    addOns: [...]
  }
}
```

---

### orderService.createOrder(discountPercent, token)

**Purpose**: Initialize a new order record on the backend  
**Called**: In CartContext.submitOrder(), STEP 1  
**Endpoint**: `POST /api/orders`  
**Authentication**: Required (Bearer token)  
**Request Body**:
```javascript
{ discountPercent: 10 }
```
**Response**:
```javascript
{ data: { orderId: 42 } }
```

---

### orderService.addOrderItems(orderId, items, addOns, token)

**Purpose**: Add products and add-ons to an order  
**Called**: In CartContext.submitOrder(), STEP 3  
**Endpoint**: `POST /api/orders/{orderId}/items`  
**Authentication**: Required (Bearer token)  
**Request Body**:
```javascript
{
  items: [
    { productId: 5, size: "Large", quantity: 2, priceAtTime: 95.00 },
    { productId: 8, size: "Small", quantity: 1, priceAtTime: 60.00 },
  ],
  addOns: {
    0: [  // Index of first cartItem
      { addOnId: 12, price: 20 },
    ],
    1: [  // Index of second cartItem
      { addOnId: 15, price: 15 },
    ],
  }
}
```
**Response**:
```javascript
{ data: { itemCount: 2, addOnCount: 1 } }
```

---

### orderService.completeOrder(orderId, paymentMethod, token)

**Purpose**: Finalize order with payment information  
**Called**: In CartContext.submitOrder(), STEP 4  
**Endpoint**: `POST /api/orders/{orderId}/complete`  
**Authentication**: Required (Bearer token)  
**Request Body**:
```javascript
{ paymentMethod: "cash" }  // or "card", "check", etc.
```
**Response**:
```javascript
{
  data: {
    orderId: 42,
    timestamp: "2024-05-11 14:35:22",
    items: [...],
    total: 190.00,
    discount: 10,
    paymentMethod: "cash",
    change: 310.00,  // If cash payment
  }
}
```

---

## Key Functions Reference

### Pos.jsx Functions

```javascript
// Data Fetching
async fetchProducts()
  - Called on component mount
  - Fetches products, categories, add-ons from API
  - Updates local state (products, categories, addOns)
  - Sets loading/error flags

// Filtering & Search
getProductsByCategory(categoryId)
  - Returns products matching the category
  - Used in useMemo to filter product list

searchProducts(query)
  - Returns products matching search text in name or description
  - Used in useMemo to further filter list

// Cart Interactions
handleAddToCart(product, quantity, size)
  - Calls CartContext.addToCart()
  - Shows feedback toast for 2 seconds
  - Part of user feedback workflow

// Modal Management
handleOpenPaymentModal()
  - Opens payment modal (setShowPaymentModal(true))

handleClosePaymentModal()
  - Closes payment modal (setShowPaymentModal(false))

handlePaymentComplete(order)
  - Receives completed order from Payment component
  - Updates state: orderData, closes payment modal, opens receipt

handleCloseReceipt()
  - Closes receipt modal
  - Clears orderData
```

### CartContext Functions

```javascript
// Item Management
addToCart(product, quantity, size)
  - Creates new cart item with unique ID
  - Sets quantity to 1 (no merging)
  - Adds to cartItems array
  - Triggers localStorage save

removeFromCart(itemId)
  - Filters out item by ID
  - Updates cartItems
  - Triggers localStorage save

updateQuantity(itemId, newQuantity)
  - If newQuantity ≤ 0, removes item
  - Otherwise, updates quantity on specific item
  - Triggers localStorage save

toggleAddOn(itemId, addOn)
  - Finds item by ID
  - Toggles add-on in array (add if missing, remove if exists)
  - Triggers localStorage save

// Order Workflow
clearCart()
  - Resets cartItems to []
  - Resets discountPercent to 0
  - Triggers localStorage save

submitOrder(paymentMethod, token)
  - Orchestrates 4-step order submission (see Flow 4)
  - Returns completed order data
  - Clears cart on success
  - Throws error on failure (caller handles)

// Calculation
calculateTotals()
  - Called after every cart change
  - Computes: subtotal, discountAmount, total
  - Rounds to 2 decimal places
  - Returns { subtotal, discountAmount, subtotalAfterDiscount, total }
```

---

## User Workflows

### Complete Purchase Workflow

1. **Browse Products**
   - Page loads → fetchProducts() → products displayed
   - User searches with search bar → filteredProducts updates → grid re-renders
   - User clicks category button → selectedCategory updates → grid filtered

2. **Add Items to Cart**
   - User clicks product → ProductCard size selector appears
   - User selects size → Clicks "Add to Cart"
   - handleAddToCart() → CartContext.addToCart() → Toast shows → Item in cart

3. **Manage Cart (Optional)**
   - User adjusts quantity via +/- buttons → updateQuantity() → Totals recalculate
   - User removes item → removeFromCart() → Totals recalculate
   - User toggles add-ons → toggleAddOn() → Totals recalculate including add-on prices
   - User applies discount → setDiscountPercent() → Discount applied, total updated

4. **Proceed to Checkout**
   - User clicks "Proceed to Payment" → setShowPaymentModal(true)
   - Payment modal opens → User enters cash amount
   - User clicks "Pay Now" → CartContext.submitOrder('cash', token) initiates

5. **Submit Order (Backend)**
   - API Step 1: Create order record (GET orderId)
   - API Step 2: Add order items + add-ons
   - API Step 3: Complete order (finalize, mark paid)
   - CartContext.clearCart() → Next transaction ready

6. **View Receipt & Next Customer**
   - Receipt modal shows order details (ID, items, total, timestamp)
   - User closes receipt → Receipt modal closes
   - Cart is empty → "Cart is empty" message shows
   - Ready for next customer

---

## Key Concepts & Design Decisions

### Why localStorage?

LocalStorage persists cart data even if the browser closes. This is useful for:
- Power outages or app crashes (don't lose customer's order)
- Staff leaving POS terminal mid-transaction (customer can come back and proceed)

**Note**: localStorage data is **not encrypted**. Only store cart data, not sensitive info like passwords.

### Why No Item Merging?

When you add the same product twice, each creates a separate cart item. This design allows:
- Different add-ons for the "same" product (e.g., one iced coffee with honey, another with extra shot)
- Easier quantity management (each transaction unit independent)
- Simpler UI (each CartItemRow is atomic)

If you need to merge identical items, do it in the UI layer (e.g., combine on display) rather than in state.

### Why Async submitOrder?

The `submitOrder` function is async and makes 4 sequential API calls because:
1. Order must exist before adding items (orderId required)
2. Items must be added before finalizing (complete needs item count)
3. Each step builds on the previous (dependent workflow)
4. If any step fails, the entire order submission fails (all-or-nothing)

This is safer than individual "add item" calls scattered through the code.

### Token-Based Authentication

All cart/order operations requiring backend changes (POST /api/orders, etc.) use Bearer tokens:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
}
```

The token comes from AuthContext and is passed through to CartContext. **Never store or commit real tokens.**

---

## Common Questions

**Q: If I refresh the page, do I lose the cart?**  
A: No! The cart is saved in localStorage. On page reload, CartContext loads it back during mount.

**Q: Can I apply a discount after paying?**  
A: No, the discount is applied before payment. Once you click "Pay Now", the order is submitted with the discount that was set.

**Q: What happens if the internet cuts out during payment?**  
A: The submitOrder() function will throw an error. The cart remains unchanged, and the user can retry after internet is restored.

**Q: Why do cart totals show decimals?**  
A: Prices are stored as decimals (e.g., 95.50 pesos). The code rounds to 2 decimal places for display using `.toFixed(2)`.

**Q: Can multiple users edit the same cart?**  
A: Yes, if they're on the same device/browser. But localStorage is per-device, so each device has its own cart.

