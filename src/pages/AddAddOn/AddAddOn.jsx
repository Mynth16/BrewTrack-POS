import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddAddOn.css';

function AddAddOn() {
    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState([]);
    const [formData, setFormData] = useState({
        ingredientID: '',
        addOnName: '',
        addOnPrice: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const response = await fetch('/api/ingredients');
                const data = await response.json();
                setIngredients(data.ingredients || []);
            } catch (error) {
                console.error('Failed to fetch ingredients:', error);
            }
        };
        fetchIngredients();
    }, []);

    const handleInputChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/addons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ingredientID: Number(formData.ingredientID),
                    addOnName: formData.addOnName.trim(),
                    addOnPrice: Number(formData.addOnPrice)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add add-on');
            }

            navigate('/inventory');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-addon-container">
            <div className="add-addon-form-wrapper">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h2>Add New Add-On</h2>
                        <button 
                            type="button" 
                            className="back-button" 
                            onClick={() => navigate('/inventory')}
                        >
                            Back
                        </button>
                    </div>
                    <hr />

                    <div className="form-question">
                        <label>Select Ingredient:</label>
                        <div className="form-answer">
                            <select 
                                value={formData.ingredientID} 
                                onChange={handleInputChange('ingredientID')}
                                required
                            >
                                <option value="">Select Ingredient</option>
                                {ingredients.map(ingredient => (
                                    <option key={ingredient.ingredientID} value={ingredient.ingredientID}>
                                        {ingredient.ingredientName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-question">
                        <label>Add-On Name:</label>
                        <div className="form-answer">
                            <input
                                type="text"
                                value={formData.addOnName}
                                onChange={handleInputChange('addOnName')}
                                placeholder="Enter add-on name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-question">
                        <label>Price:</label>
                        <div className="form-answer">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.addOnPrice}
                                onChange={handleInputChange('addOnPrice')}
                                placeholder="Enter price"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        className="add-addon-button"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Add-On'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddAddOn;