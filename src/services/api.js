
// Product Service - API calls for products, categories, and add-ons

const API_BASE_URL = 'http://localhost:3000/api';

export const productService = {

    // Fetch all products, categories, and add-ons
    async getProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            const { data } = await response.json();
            // data contains { categories, products, addOns }
            // Return just the products array for reports
            return data.products || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

   // Fetch available add-ons for a specific product
    async getProductAddOns(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/addons`);
            if (!response.ok) {
                throw new Error(`Failed to fetch add-ons: ${response.statusText}`);
            }
            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching product add-ons:', error);
            throw error;
        }
    },
};

// Order Service - API calls for order creation and management
export const orderService = {
  
    async createOrder(discountPercent, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ discountPercent }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create order: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

  
    async addOrderItems(orderId, items, addOns, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ items, addOns }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add order items: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding order items:', error);
            throw error;
        }
    },

  
    async completeOrder(orderId, paymentMethod, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentMethod }),
            });

            if (!response.ok) {
                throw new Error(`Failed to complete order: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error completing order:', error);
        throw error;
        }
    },

  
    // Fetch full order details
    async getOrder(orderId, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch order: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Fetch filtered orders for reports
    async getOrders(filters = {}, token) {
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE_URL}/orders${query ? '?' + query : ''}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },
};

// User Service - API calls for users and cashiers
export const userService = {
    
    // Fetch all cashiers
    async getCashiers(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/cashiers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch cashiers: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching cashiers:', error);
            throw error;
        }
    },

    // Fetch all active users/accounts
    async getAllUsers(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const { data } = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
};
