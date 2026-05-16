import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation/Navigation.jsx';
import './Inventory.css';
import placeHolderImage from '../../assets/brewtrack_logo.png';

function Inventory() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const [ingredientList, setIngredientList] = useState([]);
    const [productList, setProductList] = useState([]);
    const[searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ingredients'); //default ang ingredient
    const isManager = user?.role === 'Manager';

  useEffect(() => {
    const loadData = async () => {
        try {
            //FEtching ingredients
            const ingredientsResponse = await fetch('/api/ingredients');
            if (ingredientsResponse.ok) {
                const ingredientsData = await ingredientsResponse.json();
                setIngredientList(ingredientsData.ingredients || []);
            }

            //Fetching Products
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

//Get Categories from the products
const categories = [...new Set(productList.map(p => p.category).filter(Boolean))];

//Filters
const filterOptions = ['All Products', 'ingredients', ...categories];

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
        <div className = "inventory-container">
            <Navigation />
            <section>
                <h1>Inventory</h1>
                <div className = "inventory-content">
                    <div className = "inventory-list">
                        <div className = "inventory-list-header">
                            <form className = "search-and-filters">
                                <div className = "s-and-f-actual">
                                    <input className = "inv-search-bar" type = "text" placeholder = "⌕ Search current category" onChange = {(e) => setSearchTerm(e.target.value)}/>
                                    <select className = "inv-filter" value = {filter} onChange = {(e) => setFilter(e.target.value)}>
                                        <option value = "all">All Products</option>
                                        <option value = "ingredients">Ingredients</option>
                                        {categories.map(category => (
                                            <option key = {category} value = {category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {isManager && 
                                    <div className = "extra-buttons">
                                            <button type = "button" onClick = {() => navigate(`/inventory/restock`)}>
                                                Restock
                                            </button>
                                            <button type = "button" onClick={() => navigate('/inventory/add-addon')}
                                            >
                                                Add New Add-On
                                            </button>
                                            <button type = "button" onClick = {() => navigate(`/inventory/add-product`)}>
                                                Add New Product/Ingredient
                                            </button>
                                    </div>
                                }
                            </form>
                            
                        </div>

                        {isIngredient ? (
                            // Table uses ingredients
                            <table>
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
                                                <button className = "inv-update-button" onClick = {() => navigate(`/inventory/update-ingredient/${item.ingredientID}`)}>
                                                    Update
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            // Card grid for products
                            <div className="inv-products-container">
                            {displayedData.map((product) => (
                                <div key={product.productID} className="inv-product-card">
                                    <div className = "inv-product-image-wrap">
                                        {product.imageURL ? (
                                            <img src={product.imageURL} alt={product.productName} className="inv-product-image" />
                                        ) : (
                                            <img src = {placeHolderImage} className = "inv-product-image-placeholder" alt = "This product uses a placeholder image, but the placeholder image seems to be missing." />
                                        )}
                                    </div>
                                    <div className="inv-product-card-content">
                                        <h3>{product.productName}</h3>
                                        <p className="inv-product-category">{product.category}</p>
                                        <div className="inv-product-stock">
                                        <strong>Stock:</strong> <span className="stock-value">{product.stock}</span>
                                        </div>
                                    </div>
                                    <div className = "inv-product-card-footer">
                                        {isManager && 
                                            <button className = "inv-update-button" onClick = {() => navigate(`/inventory/update-product/${product.productID}`)}>
                                                Update
                                            </button>
                                        }
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Inventory;