import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEffect, useState } from 'react';
import './AddProduct.css'


function AddProduct() {

    const navigate = useNavigate();
    const [toggleEditMode, setToggleEditMode] = useState('product');
    const [categories, setCategories] = useState([]);
    const [ingredientList, setIngredientList] = useState([]);
    const [addOnsList, setAddOnsList] = useState([]);

    const handleToggle = () => {
        setToggleEditMode(
            prev => prev === 'product' ? 'ingredient' : 'product'
        );
    }

    useEffect(() => {
        const fetchCategories = async () => {
            const response = await fetch('/api/products/categories');
            const data = await response.json();
            setCategories(data.data);
        };

        const fetchIngredients = async () => {
            const response = await fetch('/api/ingredients');
            const data = await response.json();
            setIngredientList(data.ingredients);
        }

        const fetchAddOns = async () => {
        const response = await fetch('/api/addons');
        const data = await response.json();
        setAddOnsList(data.addOns);
    };


        fetchCategories();
        fetchIngredients();
        fetchAddOns();
    }, []);

    //FOR THE ADD-ONS (APPLICABLE TO ALL PRODUCT TYPES)
        const handleAddOnChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            addOns: prev.addOns.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };

    const handleAddAddOnRow = () => {
        setProductForm(prev => ({
            ...prev,
            addOns: [...prev.addOns, { addOnID: '', quantityRequired: '' }]
        }));
    };

    const handleRemoveAddOnRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            addOns: prev.addOns.filter((_, i) => i !== index)
        }));
    };

    const getAvailableAddOns = (currentIndex) => {
        const selectedIDs = productForm.addOns
            .map((row, i) => i !== currentIndex ? row.addOnID : null)
            .filter(id => id !== null && id !== '');
        
        return addOnsList.filter(addOn =>
            !selectedIDs.includes(String(addOn.addOnID))
        );
    };

    //FOR THE PRODUCTS (ALL CATEGORIES)
    const [productForm, setProductForm] = useState({
        productName:  '',
        category: '',
        productType: '',
        price: '',
        priceAndSize: [{size: '', price: ''}],
        drinkIngredients: [{ingredientID: '', quantityRequired: {}}],
        flavors: [{ flavorName: '', price: '' }],
        ingredients: [{ingredientID: '', quantityRequired: ''}],
        addOns: [{addOnID: '', quantityRequired: ''}]
    });

    const handleProductForm = (field) => (event) => {
        setProductForm(prev => ({ ...prev, [field]: event.target.value}));
    }

    const handleIngredientChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    }

    const handleAddIngredientRow = () => {
        setProductForm(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ingredientID: '', quantityRequired: '' }]
        }));
    };

    const handleRemoveIngredientRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const getAvailableIngredients = (currentIndex) => {
        const selectedIDs = productForm.ingredients
            .map((row, i) => i !== currentIndex ? row.ingredientID : null)
            .filter(id => id !== null && id !== '');
        
        return ingredientList.filter(ingredient => 
            !selectedIDs.includes(String(ingredient.ingredientID))
        );
    };

    //PRODUCTS, BUT FOR DRINKS
    const handleSizeChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            priceAndSize: prev.priceAndSize.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };

    const handleAddSizeRow = () => {
        setProductForm(prev => ({
            ...prev,
            priceAndSize: [...prev.priceAndSize, { size: '', price: '' }]
        }));
    };

    const handleRemoveSizeRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            priceAndSize: prev.priceAndSize.filter((_, i) => i !== index)
        }));
    };

    const handleDrinkIngredientChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: prev.drinkIngredients.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };

    const handleDrinkIngredientQuantityChange = (ingredientIndex, size) => (event) => {
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: prev.drinkIngredients.map((row, i) =>
                i === ingredientIndex
                    ? { ...row, quantities: { ...row.quantities, [size]: event.target.value } }
                    : row
            )
        }));
    };

    const handleAddDrinkIngredientRow = () => {
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: [...prev.drinkIngredients, { ingredientID: '', quantities: {} }]
        }));
    };

    const handleRemoveDrinkIngredientRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: prev.drinkIngredients.filter((_, i) => i !== index)
        }));
    };

    const getAvailableDrinkIngredients = (currentIndex) => {
        const selectedIDs = productForm.drinkIngredients
            .map((row, i) => i !== currentIndex ? row.ingredientID : null)
            .filter(id => id !== null && id !== '');
        return ingredientList.filter(ingredient =>
            !selectedIDs.includes(String(ingredient.ingredientID))
        );
    };

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
            {toggleEditMode === 'product' ? (
                <div className = "add-product-form-wrapper">
                    <form>
                        <div class = "form-header">
                            <h2>Add Product</h2>
                            <div className = "add-product-ingredient-buttons">
                                <button onClick = {handleToggle}>Toggle Product/Ingredient</button>
                                <button type = "button" onClick = {() => navigate('/inventory')}> Back </button>
                            </div>
                        </div>
                        <hr />
                        <div className = "form-question">
                            <label>Enter Product Name: </label>
                            <input 
                                type = "text"
                                placeholder = "Enter Product Name"
                                required />
                        </div>
                        <div className = "form-question">
                            <label>Select Category: </label>
                            <select value = {productForm.category} onChange = {handleProductForm('category')}>
                                <option value = "">Select Category</option>
                                {categories.map(category => (
                                    <option key = {category} value = {category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div className = "form-question">
                            <label>Select Image: </label>
                        </div>
                        {productForm.addOns.map((row, index) => (
                        <div className = "form-question">
                            <label>Select all the add-ons available for this product: </label>
                            <div key={index} className="addon-row">
                                <select
                                    value={row.addOnID}
                                    onChange={handleAddOnChange(index, 'addOnID')}>
                                    <option value="">Select Add-On</option>
                                    {getAvailableAddOns(index).map(addOn => (
                                        <option key={addOn.addOnID} value={addOn.addOnID}>
                                            {addOn.addOnName}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter quantity required"
                                    value={row.quantityRequired}
                                    onChange={handleAddOnChange(index, 'quantityRequired')} />
                                {productForm.addOns.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveAddOnRow(index)}>Remove</button>
                                )}
                            </div>
                        </div>
                    ))}
                        
                        <button type="button" className = "addAddOnButton"onClick={handleAddAddOnRow}>+ Add Add-On</button>
                        <div className = "form-question">
                            <label>Select Product Type (Cannot be changed later): </label>
                            <select value = {productForm.productType} onChange = {handleProductForm('productType')}>
                                <option value = "">Select Product Type</option>
                                <option value = "simpleProduct">Meals</option> {/*SIMPLE PRODUCTS SA DATABASE, BUT CALLED MEALS HERE FOR CLARITY*/}
                                <option value = "drink">Drinks</option>
                                <option value = "flavoredItem">Flavored Foods (Ex. Fries)</option>
                            </select>
                        </div>

                        {/*DIFFERENT QUESTIONS APPEAR DEPENDING ON PRODUCT TYPE*/}

                        {/*ADDITIONAL QUESTIONS FOR SIMPLE PRODUCTS*/}
                        {productForm.productType === 'simpleProduct' && (
                            <div>
                                <div className = "form-question">
                                    <label>Price: </label>
                                    <input
                                        type = "number"
                                        min = "0"
                                        step = "0.01"
                                        placeholder = "Enter Price"
                                        value = {productForm.price}
                                        onChange = {handleProductForm('price')}
                                        required />
                                </div>
                                {productForm.ingredients.map((row, index) => (
                                    <div key = {index}>
                                        <label>Select the ingreidients this product uses (w/ quantities): </label>
                                        <select
                                            value = {row.ingredientID}
                                            onChange = {handleIngredientChange(index, 'ingredientID')}>
                                            <option value = "">Select Ingredient</option>
                                            {getAvailableIngredients(index).map(ingredient => (
                                                <option 
                                                    key = {ingredient.ingredientID} 
                                                    value = {ingredient.ingredientID}>
                                                    {ingredient.ingredientName}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type = "number"
                                            min = "0"
                                            step = "0.01"
                                            placeholder = "Enter quantity of that ingredient here" 
                                            value = {row.quantityRequired}
                                            onChange = {handleIngredientChange(index, 'quantityRequired')} />
                                        {productForm.ingredients.length > 1 && (
                                            <button type = "button" onClick = {() => handleRemoveIngredientRow(index)}>Remove</button>
                                        )}
                                    </div>
                                ))}
                                <button type = "button" onClick = {handleAddIngredientRow}>Add Ingredient</button>
                            </div>

                        )}

                        {/*ADDITIONAL QUESTIONS FOR DRINKS */}
                        {productForm.productType === 'drink' && (
                            <div>
                                <div className="form-question">
                                    <label>Sizes and Prices:</label>
                                    {productForm.priceAndSize.map((row, index) => (
                                        <div key={index} className="size-row">
                                            <input
                                                type="text"
                                                placeholder="Size (e.g. 12oz)"
                                                value={row.size}
                                                onChange={handleSizeChange(index, 'size')} />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Price"
                                                value={row.price}
                                                onChange={handleSizeChange(index, 'price')} />
                                            {productForm.priceAndSize.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveSizeRow(index)}>Remove</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddSizeRow}>+ Add Size</button>
                                </div>

                                <div className="form-question">
                                    <label>Ingredients and Quantities per Size:</label>
                                    <div className="drink-ingredient-row">
                                        <span>Ingredient</span>
                                        {productForm.priceAndSize
                                            .filter(s => s.size !== '')
                                            .map((s, i) => (
                                                <span key={i}>{s.size}</span>
                                            ))
                                        }
                                        <span></span> {/* SPACE FOR THE REMOVE BUTTON */}
                                    </div>

                                    {productForm.drinkIngredients.map((row, index) => (
                                        <div key={index} className="drink-ingredient-row">
                                            <select
                                                value={row.ingredientID}
                                                onChange={handleDrinkIngredientChange(index, 'ingredientID')}>
                                                <option value="">Select Ingredient</option>
                                                {getAvailableDrinkIngredients(index).map(ingredient => (
                                                    <option key={ingredient.ingredientID} value={ingredient.ingredientID}>
                                                        {ingredient.ingredientName}
                                                    </option>
                                                ))}
                                            </select>
                                            {productForm.priceAndSize
                                                .filter(s => s.size !== '')
                                                .map((s, sizeIndex) => (
                                                    <input
                                                        key={sizeIndex}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder={`Qty for ${s.size}`}
                                                        value={row.quantities?.[s.size] || ''}
                                                        onChange={handleDrinkIngredientQuantityChange(index, s.size)} />
                                                ))
                                            }

                                            {productForm.drinkIngredients.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveDrinkIngredientRow(index)}>Remove</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddDrinkIngredientRow}>+ Add Ingredient</button>
                                </div>
                            </div>
                        )}

                        {/*ADDITIONAL QUESTIONS FOR FLAVORED ITEMS*/}
                        {productForm.productType === 'flavoredItem' && (
                            <div classNam = "form-question">
                                <label>Enter Flavor and Price: </label>
                                <input
                                    type = "text"
                                    placeholder = "Enter Flavor Here" />
                                <input
                                    type = "number"
                                    min = "0"
                                    step = "0.01"
                                    placeholder = "Enter Price Here" />
                            </div>
                        )}
                    </form>
                </div>
            ) : (
                <div className = "add-ingredient-form-wrapper">
                    <form>
                        <div className = "form-header">
                            <h2>Add Ingredient</h2>
                            <div className = "add-product-ingredient-buttons">
                                <button className = "back-button" onClick = {handleToggle}>Toggle Product/Ingredient</button>
                                <button className = "back-button" type = "button" onClick = {() => navigate('/inventory')}>Back</button>
                            </div>
                        </div>
                        <hr />
                        <div className = "form-question">
                            <label>Enter Ingredient Name: </label>
                            <input 
                            type = "text"
                            placeholder = "Enter Ingredient Name" 
                            onChange = {handleIngredientsForm('ingredientName')} required/>
                        </div>
                        <div className = "form-question">
                            <label>Enter Current Stock Quantity: </label>
                            <input 
                            type = "number"
                            min = "0"
                            step = "0.01"
                            placeholder = "Enter Current Stock Quantity" 
                            onChange = {handleIngredientsForm('stockQuantity')} required />
                        </div>
                        <div className = "form-question">
                            <label>Enter Minimum Stock Level (For Alerts): </label>
                            <input 
                            type = "number"
                            min = "0"
                            step = "0.01"
                            placeholder = "Enter Minimum Stock Level"
                            onChange = {handleIngredientsForm('minStockLevel')} />
                        </div>
                        <div className = "form-question">
                            <label>Enter Unit: </label>
                            <input
                            type = "text"
                            placeholder = "Ex. (l, m, kg)" required 
                            onChange = {handleIngredientsForm('unit')} />
                        </div>
                        <div className = "form-question">
                            <label>Enter Expiration Date: </label>
                            <input 
                            type = "date"
                            onChange = {handleIngredientsForm('expiryDate')} />
                        </div>
                        <div className = "submit-button-container">
                            <button className = "submit-button" onClick = {handleSubmitIngredients}>
                                Add Ingredient
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

export default AddProduct;