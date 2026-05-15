import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../../components/Navigation/Navigation';
import { orderService, userService, productService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './ReportScreen.css';

const ITEMS_PER_PAGE = 10;

function ReportScreen() {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        cashierId: '',
        productId: ''
    });
    const [cashiers, setCashiers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial data (cashiers and products)
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                console.log('Token:', token);
                console.log('Fetching initial data...');
                const cashierData = await userService.getAllUsers(token);
                console.log('Cashiers raw response:', cashierData);
                
                const productData = (await productService.getProducts())?.products || [];
                console.log('Products raw response:', productData);
                
                setCashiers(Array.isArray(cashierData) ? cashierData : []);
                setProducts(Array.isArray(productData) ? productData : []);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setError(`Failed to load filters: ${error.message}`);
            }
            setLoading(false);
        }
        if (token) {
            fetchInitialData();
        }
    }, [token]);

    // Fetch filtered orders whenever filters change
    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching orders with filters:', filters);
                console.log('Token available:', !!token);
                const filteredOrders = await orderService.getOrders(filters, token);
                console.log('Orders raw response:', filteredOrders);
                console.log('Orders type:', Array.isArray(filteredOrders) ? 'array' : typeof filteredOrders);
                console.log('Orders count:', Array.isArray(filteredOrders) ? filteredOrders.length : 'N/A');
                setOrders(Array.isArray(filteredOrders) ? filteredOrders : []);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
                console.error("Error details:", error.message);
                setError(error.message || "Failed to fetch orders");
                setOrders([]);
            }
            setLoading(false);
        }
        if (token) {
            fetchOrders();
        }
    }, [filters, token]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to page 1 when filters change
    };

    // Calculate pagination values
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString();
    };

    return (
        <div className="report-screen-wrapper">
            <Navigation />
            <div className="report-screen">
                <div className="report-header">
                    <h1>Reports</h1>
                    <div className="filters-container">
                <div className="filter-item">
                    <label>From:</label>
                    <input 
                        type="date" 
                        name="startDate" 
                        value={filters.startDate} 
                        onChange={handleFilterChange}
                        className="filter-input"
                    />
                </div>
                <div className="filter-item">
                    <label>To:</label>
                    <input 
                        type="date" 
                        name="endDate" 
                        value={filters.endDate} 
                        onChange={handleFilterChange}
                        className="filter-input"
                    />
                </div>
                <div className="filter-item">
                    <label>Cashier:</label>
                    <select 
                        name="cashierId" 
                        value={filters.cashierId} 
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">All</option>
                        {cashiers.map(c => (
                            <option key={c.accountID} value={c.accountID}>
                                {c.firstName} {c.lastName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-item">
                    <label>Has Item/s:</label>
                    <select 
                        name="productId" 
                        value={filters.productId} 
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">Any</option>
                        {products.map(p => (
                            <option key={p.productID} value={p.productID}>
                                {p.productName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
                </div>

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="report-table-container">
                    {orders.length > 0 ? (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Date and Time</th>
                                    <th>Cashier</th>
                                    <th>Items</th>
                                    <th>Discount</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map(order => (
                                    <tr key={order.orderID}>
                                        <td>{formatDateTime(order.dateAndTime)}</td>
                                        <td>{order.cashierName}</td>
                                        <td className="items-cell">
                                            {order.items && order.items.map(item => (
                                                <div key={item.orderItemID} className="item-row">
                                                    <span>{item.productName} x{item.quantity}</span>
                                                    {item.addOns && item.addOns.length > 0 && (
                                                        <ul className="addons-list">
                                                            {item.addOns.map((ao, idx) => (
                                                                <li key={idx}>{ao.addOnName}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                        <td>{order.discountPercent}%</td>
                                        <td className="total-cell">₱{parseFloat(order.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data">No orders found for the selected filters.</div>
                    )}
                    {orders.length > 0 && (
                        <div className="pagination-controls">
                            <button 
                                className="pagination-btn"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>
                            <div className="pagination-info">
                                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                                <span className="items-indicator">Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders</span>
                            </div>
                            <button 
                                className="pagination-btn"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
}

export default ReportScreen;
