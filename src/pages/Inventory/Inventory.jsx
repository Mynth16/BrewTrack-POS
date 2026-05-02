import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation/Navigation.jsx';
import './Inventory.css';

function Inventory() {

    const [ingredientList, setIngredientList] = useState([]);
    const [productList, setProductList] = useState([]);
    const[searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ingredients'); //default ang ingredients

  useEffect(() => {
    const loadData = async () => {
        try {
            //FEtching ingredients
            const ingredientsResponse = await fetch('/api/ingredients');
            if (ingredientsResponese.ok) {
                const ingredientsData = await ingredientsResponse.json();
                setIngredientList(ingredientsData.ingredients || []);
            }

            //Fetching Products
            const productsResponse = await fetch('/api/products');
            if (productsResponse.ok) {
                const productsResponse = await productsResponse.json();
                setProductsList(productsData.products || []);
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

if (filter === 'all') {
    displayedData = productList;
} else if (filter === 'ingredients') {
    displayedData = ingredientList.filter((ingredient) =>
        ingredient.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    isIngredients = true;
} else {
    displayedData = productList.filter(p => p.category === filter);
}

    return (
        <div className = "inventory-container">
            <Navigation />
            <section>
                <h1>Inventory</h1>
                <div className = "inventory-content">
                    <div className = "inventory-list">
                        <form action = "">
                            <select value = {filter} onChange = {(e) => setFilter(e.target.value)}>
                                <option value = "all">All Products</option>
                                <option value = "ingredients">Ingredients</option>
                                {categories.map(category => ())}
                            </select>
                        </form>
                        <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Stock</th>
                                <th>Min Stock</th>
                                <th>Unit</th>
                                <th>Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            <thead>
                                {isIngredients ? (
                                    <tr>
                                        <th>Name</th>
                                        <th>Stock</th>
                                        <th>Min Stock</th>
                                        <th>Unit</th>
                                        <th>Expiry</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th></th>
                                    </tr>
                                )

                                }
                            </thead>
                        </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Inventory;