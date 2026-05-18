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
        <div className="aa-wrapper">
            <div className="aa-screen">

                {/* ── Header ── */}
                <div className="aa-header">
                    <h1>Add New Add-On</h1>
                    <button
                        type="button"
                        className="aa-back-btn"
                        onClick={() => navigate('/inventory')}
                    >
                        Back
                    </button>
                </div>

                {/* ── Form card ── */}
                <div className="aa-card">
                    <form onSubmit={handleSubmit}>

                        {error && (
                            <div className="aa-error">{error}</div>
                        )}

                        <div className="aa-field">
                            <label>Select Ingredient:</label>
                            <div className="aa-field-input">
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

                        <div className="aa-field">
                            <label>Add-On Name:</label>
                            <div className="aa-field-input">
                                <input
                                    type="text"
                                    value={formData.addOnName}
                                    onChange={handleInputChange('addOnName')}
                                    placeholder="Enter add-on name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="aa-field">
                            <label>Price:</label>
                            <div className="aa-field-input">
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

                        <button
                            type="submit"
                            className="aa-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Add-On'}
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
}

export default AddAddOn;