import './UpdateIngredient.css';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function UpdateProductIngredient() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const { ingredientID } = useParams();
    const [errorMessage, setErrorMessage] = useState('');
    const [formState, setFormState] = useState({
        ingredientName: '',
        stockQuantity: '',
        minStockLevel: '',
        unit: '',
        expiryDate: '',
    })

    useEffect(() => {
        const fetchIngredient = async () => {
            try {
                const response = await (fetch('/api/ingredients'));
                if (!response.ok) {
                    throw new Error('Failed to load ingredients');
                }

                const data = await response.json();
                const ingredient = data.ingredients?.find(
                    (item) => String(item.ingredientID) === ingredientID
                )

                setFormState({
                    ingredientName: ingredient.ingredientName || '',
                    stockQuantity: ingredient.stockQuantity || '',
                    unit: ingredient.unit || '',
                    minStockLevel: ingredient.minStockLevel || '',
                    expiryDate: ingredient.expiryDate ? ingredient.expiryDate.slice(0, 10) : '',
                });
            } catch (error) {
                console.error(error);
            }

        };

        fetchIngredient();
    }, [ingredientID]);

    const handleChange = (field) => (event) => {
        setFormState((prev) => ({
            ...prev,
            [field]: event.target.value,
        }))
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        try {
            const response = await fetch(`/api/ingredients/${ingredientID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredientName: formState.ingredientName.trim(),
                    stockQuantity: Number(formState.stockQuantity),
                    minStockLevel: formState.minStockLevel === '' ? null : Number(formState.minStockLevel),
                    unit: formState.unit.trim(),
                    expiryDate: formState.expiryDate || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update this ingredient.'); 
            }

            navigate('/inventory');
    } catch (error) {
        console.error(error);
        setErrorMessage(error.message || 'Failed to update this ingredient.');
    }
};

    return (
        <div className = "update-ingredient-container">
            <form>
                <div className = "update-ingredient-header">
                    <h1>Update Ingredient</h1>
                    <button type = "button" className = "back-button" onClick = {() => navigate('/inventory')}>
                        Back
                    </button>
                </div>
                <hr />
                <section>
                    <div className = "form-question">
                        <label>Enter New Ingredient Name: </label>
                        <input
                        type = "text" 
                        placeholder = "Enter New Ingredient Name: " 
                        value = {formState.ingredientName} 
                        onChange = {handleChange('ingredientName')} required/>
                    </div>
                    <div className = "form-question">
                        <label>Enter New Stock Quantity: </label>
                        <input
                        type = "number"
                        placeholder = "Enter New Stock Quantity: "
                        value = {formState.stockQuantity}
                        onChange = {handleChange('stockQuantity')} required/>
                    </div>
                    <div className = "form-question">
                        <label>Enter Minimum Stock Level (For Alerts): </label>
                        <input
                        type = "number"
                        placeholder = "Enter New Minimum Stock Level: "
                        value = {formState.minStockLevel}
                        onChange = {handleChange('minStockLevel')}/>
                    </div>
                    <div className = "form-question">
                        <label>Enter New Unit: </label>
                        <input 
                        type = "text"
                        placeholder = "Enter New Unit"
                        value = {formState.unit}
                        onChange = {handleChange('unit')} required/>
                    </div>
                    <div className = "form-question">
                        <label>Enter New Expiration Date: </label>
                        <input 
                        type = "date"
                        placeholder = "Enter New Expiration Date"
                        value = {formState.expiryDate}
                        onChange = {handleChange('expiryDate')}/>
                    </div>
                    <div className = "submit-button-container">
                        <button type = "submit" onClick = {handleSubmit} className = "submit-button">
                            Update Ingredient
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}

export default UpdateProductIngredient;