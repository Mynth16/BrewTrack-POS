import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation/Navigation.jsx';
import './Inventory.css';
import placeHolderImage from '../../assets/brewtrack_logo.png';

// CALCULATINGG THE SOTCK
function calcIngredientCapacity(quantityRequired, stockQuantity) {
    if (!quantityRequired || Number(quantityRequired) <= 0) return Infinity;
    return Math.max(0, Math.floor(Number(stockQuantity) / Number(quantityRequired)));
}

function calcVariantStock(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return 100;
    const caps = ingredients
        .map(i => calcIngredientCapacity(i.quantityRequired, i.stockQuantity))
        .filter(Number.isFinite);
    return caps.length ? Math.min(...caps) : 100;
}

function getVariantStocks(product) {
    const { productType, ingredientRequirements, stock } = product;

    if (productType === 'drink' && Array.isArray(ingredientRequirements) && ingredientRequirements.length > 0) {
        return ingredientRequirements.map(variant => ({
            label: variant.size,
            stock: calcVariantStock(variant.ingredients),
        }));
    }

    if (productType === 'flavoredItem' && Array.isArray(ingredientRequirements) && ingredientRequirements.length > 0) {
        return ingredientRequirements.map(variant => ({
            label: variant.flavorName,
            stock: calcVariantStock(variant.ingredients),
        }));
    }

    // simpleProduct or fallback
    return [{ label: 'Stock', stock: stock ?? 100 }];
}
// ──────────────────────────────────────────────────────────────

function Inventory() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const [ingredientList, setIngredientList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ingredients');
    const isManager = user?.role === 'Manager';

    useEffect(() => {
        const loadData = async () => {
            try {
                const ingredientsResponse = await fetch('/api/ingredients');
                if (ingredientsResponse.ok) {
                    const ingredientsData = await ingredientsResponse.json();
                    setIngredientList(ingredientsData.ingredients || []);
                }

                const productsResponse = await fetch('/api/products');
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setProductList(productsData.data.products || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, []);

    const categories = [...new Set(productList.map(p => p.category).filter(Boolean))];

    let displayedData = [];
    let isIngredient = false;
    const q = searchTerm.trim().toLowerCase();

    if (filter === 'all') {
        displayedData = productList.filter(p => {
            if (!q) return true;
            const name = (p.productName || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            return name.includes(q) || cat.includes(q);
        });
    } else if (filter === 'ingredients') {
        displayedData = ingredientList.filter(ingredient =>
            ingredient.ingredientName.toLowerCase().includes(q)
        );
        isIngredient = true;
    } else {
        displayedData = productList.filter(p => {
            if (p.category !== filter) return false;
            if (!q) return true;
            return (p.productName || '').toLowerCase().includes(q);
        });
    }

    return (
        <div className="inventory-container">
            <Navigation />
            <div className="inventory-screen">

                {/* ── Header row: title + controls ── */}
                <div className="inventory-header">
                    <h1>Inventory</h1>

                    <div className="inventory-controls">
                        <div className="control-item">
                            <label>Search:</label>
                            <input
                                className="inv-search-bar"
                                type="text"
                                placeholder="Search current category"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="control-item">
                            <label>Category:</label>
                            <select
                                className="inv-filter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Products</option>
                                <option value="ingredients">Ingredients</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isManager && (
                            <div className="extra-buttons">
                                <button type="button" onClick={() => navigate('/inventory/restock')}>
                                    Restock
                                </button>
                                <button type="button" onClick={() => navigate('/inventory/add-addon')}>
                                    Add New Add-On
                                </button>
                                <button type="button" onClick={() => navigate('/inventory/add-product')}>
                                    Add New Product/Ingredient
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content area ── */}
                <div className="inventory-table-container">
                    {isIngredient ? (
                        displayedData.length > 0 ? (
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Stock</th>
                                        {isManager && <th>Min Stock Level (For Alerts)</th>}
                                        <th>Unit</th>
                                        <th>Expiry</th>
                                        {isManager && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedData.map((item) => (
                                        <tr key={item.ingredientID}>
                                            <td>{item.ingredientName}</td>
                                            <td>{item.stockQuantity}</td>
                                            {isManager && <td>{item.minStockLevel}</td>}
                                            <td>{item.unit}</td>
                                            <td>{item.expiryDate ? item.expiryDate.slice(0, 10) : '-'}</td>
                                            {isManager && (
                                                <td>
                                                    <button
                                                        className="inv-update-button"
                                                        onClick={() => navigate(`/inventory/update-ingredient/${item.ingredientID}`)}
                                                    >
                                                        Update
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-data">No ingredients found.</div>
                        )
                    ) : (
                        displayedData.length > 0 ? (
                            <div className="inv-products-container">
                                {displayedData.map((product) => {
                                    const variantStocks = getVariantStocks(product);
                                    const isSimple = product.productType === 'simpleProduct';

                                    return (
                                        <div key={product.productID} className="inv-product-card">
                                            <div className="inv-product-image-wrap">
                                                {product.imageURL ? (
                                                    <img src={product.imageURL} alt={product.productName} className="inv-product-image" />
                                                ) : (
                                                    <img src={placeHolderImage} className="inv-product-image-placeholder" alt="Placeholder" />
                                                )}
                                            </div>
                                            <div className="inv-product-card-content">
                                                <h3>{product.productName}</h3>
                                                <p className="inv-product-category">{product.category}</p>

                                                {/* ── Stock display ── */}
                                                {isSimple ? (
                                                    <div className="inv-product-stock">
                                                        <strong>Stock:</strong>{' '}
                                                        <span className="stock-value">{variantStocks[0].stock}</span>
                                                    </div>
                                                ) : (
                                                    <div className="inv-variant-stocks">
                                                        {variantStocks.map(({ label, stock }) => (
                                                            <div key={label} className="inv-variant-stock-row">
                                                                <span className="inv-variant-label">{label}:</span>
                                                                <span className="stock-value">{stock}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="inv-product-card-footer">
                                                {isManager && (
                                                    <>
                                                        <button
                                                            className="inv-update-button"
                                                            onClick={() => navigate(`/inventory/update-product/${product.productID}`)}
                                                        >
                                                            Update
                                                        </button>
                                                        <button
                                                            className="inv-delete-button"
                                                            onClick={async () => {
                                                                if (!window.confirm(`Delete "${product.productName}"? This cannot be undone.`)) return;
                                                                try {
                                                                    const res = await fetch(`/api/products/${product.productID}`, { method: 'DELETE' });
                                                                    if (res.ok) {
                                                                        setProductList(prev => prev.filter(p => p.productID !== product.productID));
                                                                    } else {
                                                                        alert('Failed to delete product.');
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Delete error:', err);
                                                                    alert('An error occurred while deleting.');
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-data">No products found for the selected category.</div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
}

export default Inventory;