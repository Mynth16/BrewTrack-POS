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

    return (
        <div className = "add-product-container">
            <h1>Add Product/Ingredient</h1>
            <button onClick = {() => navigate(-1)}> Back </button>

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
                                placeholder = "Enter Ingredient Name" required/> <br />
                                <label>Enter Current Stock Quantity: </label>
                                <input 
                                type = "number"
                                min = "0"
                                step = "0.01"
                                placeholder = "Enter Current Stock Quantity" required /> <br />
                                <label>Enter Minimum Stock Level (For Alerts): </label>
                                <input 
                                type = "number"
                                min = "0"
                                step = "0.01"
                                placeholder = "Enter Minimum Stock Level"/>  <br />
                                <label>Enter Unit: </label>
                                <input
                                type = "text"
                                placeholder = "Ex. (l, m, kg)" required />  <br />
                                <label>Enter Expiration Date: </label>
                                <input 
                                type = "date"/>
                            </form>
                        </div>

                    )}
            </section>
        </div>
    )
}

export default AddProduct;