import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEffect, useState } from 'react';


function AddProduct() {

    const navigate = useNavigate();
    const [toggleEditMode, setToggleEditMode] = useState('product');

    const handleToggle = () => {
        setToggleEditMode(
            prev => prev === 'product' ? 'ingredient' : 'product'
        );
    }

    //THIS IS FOR THE INGREDIENTS
    const [ingredientsForm, setIngredientsForm] = useState({
        ingredientName: '',
        stockQuantity: '',
        minStockQuantity: '',
        unit: '',
        expiryDate: ''
    });

    const handleIngredientsForm = (field) => (event) => {
        setIngredientsForm(prev => ({ ...prev, [field]: event.target.value}));
    }

    const handleSubmitIngredients = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('/api/ingredients', {
                method: 'POST',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredientName: ingredientsForm.ingredientName.trim(),
                    stockQuantity: Number(ingredientsForm.stockQuantity),
                    minStockLevel: ingredientsForm === '' ? null : Number(ingredientsForm.minStockLevel),
                    unit: ingredientsForm.unit.trim(),
                    expiryDate: ingredientsForm.expiryDate || null,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add this ingredient.');
            } 

            navigate('/inventory');
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className = "add-product-container">
            <h1>Add Product/Ingredient</h1>
            <button type = "button" onClick = {() => navigate('/inventory')}> Back </button>

            <section className = "add-product-main-section">
                    <button onClick = {handleToggle}>Toggle Product/Ingredient</button>

                    {toggleEditMode === 'product' ? (
                        <div className = "add-product-form-wrapper">
                            <h2>Add Product</h2>
                        </div>
                    ) : (
                        <div className = "add-ingredient-form-wrapper">
                            <h2>Add Ingredient</h2>
                            <form>
                                <label>Enter Ingredient Name: </label>
                                <input 
                                type = "text"
                                placeholder = "Enter Ingredient Name" 
                                onChange = {handleIngredientsForm('ingredientName')} required/> <br />
                                <label>Enter Current Stock Quantity: </label>
                                <input 
                                type = "number"
                                min = "0"
                                step = "0.01"
                                placeholder = "Enter Current Stock Quantity" 
                                onChange = {handleIngredientsForm('stockQuantity')} required /> <br />
                                <label>Enter Minimum Stock Level (For Alerts): </label>
                                <input 
                                type = "number"
                                min = "0"
                                step = "0.01"
                                placeholder = "Enter Minimum Stock Level"
                                onChange = {handleIngredientsForm('minStockLevel')} />  <br />
                                <label>Enter Unit: </label>
                                <input
                                type = "text"
                                placeholder = "Ex. (l, m, kg)" required 
                                onChange = {handleIngredientsForm('unit')} />  <br />
                                <label>Enter Expiration Date: </label>
                                <input 
                                type = "date"
                                onChange = {handleIngredientsForm('expiryDate')} />
                                <button onClick = {handleSubmitIngredients}>
                                    Add Ingredient
                                </button>
                            </form>
                        </div>

                    )}
            </section>
        </div>
    )
}

export default AddProduct;