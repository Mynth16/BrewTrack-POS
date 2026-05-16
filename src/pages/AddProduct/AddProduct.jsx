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
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [formError, setFormError] = useState(null);

    // CONDITIONS BEFORE SUBMITTING
    const validateProduct = () => {
        if (!productForm.productName.trim()) return 'Product name is required.';
        if (!productForm.category) return 'Category is required.';
        if (!productForm.productType) return 'Product type is required.';

        if (productForm.productType === 'simpleProduct') {
            if (!productForm.price) return 'Price is required.';

            const filledIngredients = productForm.ingredients.filter(i => i.ingredientID !== '' || i.quantityRequired !== '');
            if (filledIngredients.length === 0) return 'At least one ingredient is required.';
            for (const i of filledIngredients) {
                if (!i.ingredientID || !i.quantityRequired) return 'All ingredient rows must have both an ingredient and a quantity.';
            }
        }

        if (productForm.productType === 'drink') {
            const filledSizes = productForm.priceAndSize.filter(s => s.size !== '' || s.price !== '');
            if (filledSizes.length === 0) return 'At least one size with a price is required.';
            for (const s of filledSizes) {
                if (!s.size || !s.price) return 'All size rows must have both a size and a price.';
            }

            const filledIngredients = productForm.drinkIngredients.filter(i => i.ingredientID !== '');
            if (filledIngredients.length === 0) return 'At least one ingredient is required.';
            const validSizes = productForm.priceAndSize.filter(s => s.size !== '' && s.price !== '');
            for (const i of filledIngredients) {
                for (const s of validSizes) {
                    if (!i.quantities?.[s.size]) return `Missing quantity for ingredient in size "${s.size}".`;
                }
            }
        }

        if (productForm.productType === 'flavoredItem') {
            const filledFlavors = productForm.flavors.filter(f => f.flavorName !== '' || f.price !== '');
            if (filledFlavors.length === 0) return 'At least one flavor with a price is required.';
            for (const f of filledFlavors) {
                if (!f.flavorName || !f.price) return 'All flavor rows must have both a name and a price.';
            }

            const filledIngredients = productForm.flavorIngredients.filter(i => i.ingredientID !== '');
            if (filledIngredients.length === 0) return 'At least one ingredient is required.';
            const validFlavors = productForm.flavors.filter(f => f.flavorName !== '' && f.price !== '');
            for (const i of filledIngredients) {
                for (const f of validFlavors) {
                    if (!i.quantities?.[f.flavorName]) return `Missing quantity for ingredient in flavor "${f.flavorName}".`;
                }
            }
        }

        const partialAddOns = productForm.addOns.filter(a => a.addOnID !== '' || a.quantityRequired !== '');
        for (const a of partialAddOns) {
            if (!a.addOnID || !a.quantityRequired) return 'All add-on rows must have both an add-on selected and a quantity.';
        }

        return null;
    };

    const handleToggle = () => {
        setToggleEditMode(
            prev => prev === 'product' ? 'ingredient' : 'product'
        );
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview('');
    };

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
        imageUrl: '',
        drinkIngredients: [{ingredientID: '', quantityRequired: {}}],
        flavors: [{ flavorName: '', price: '' }],
        flavorIngredients: [{ ingredientID: '', quantities: {} }],
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

const handleSubmitProduct = async (event) => {
    event.preventDefault();

    const error = validateProduct();
        if (error) {
            setFormError(error);
            return;
        }
        setFormError(null);

        try {
            const body = {
                productName: productForm.productName,
                category: productForm.category,
                productType: productForm.productType,
                addOns: productForm.addOns
                    .filter(a => a.addOnID !== '' && a.quantityRequired !== '')
                    .map(a => ({ addOnID: Number(a.addOnID), quantityRequired: Number(a.quantityRequired) })),

                // simpleProduct fields
                price: Number(productForm.price),
                ingredients: productForm.ingredients
                    .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                    .map(i => ({ ingredientID: Number(i.ingredientID), quantityRequired: Number(i.quantityRequired) })),

                // drink fields
                priceAndSize: productForm.priceAndSize.filter(s => s.size !== '' && s.price !== ''),
                drinkIngredients: productForm.drinkIngredients
                    .filter(i => i.ingredientID !== '')
                    .map(i => ({
                        ingredientID: Number(i.ingredientID),
                        quantities: i.quantities
                    })),

                //flavored fields
                flavors: productForm.flavors.filter(f => f.flavorName !== '' && f.price !== ''),
                flavorIngredients: productForm.flavorIngredients
                    .filter(i => i.ingredientID !== '').map(i => ({
                        ingredientID: Number(i.ingredientID),
                        quantities: i.quantities
                    })),
            };

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add product.');
            }

            // Get productID from response
            const responseData = await response.json();
            const productID = responseData.productID;

            // Upload image if selected
            if (selectedImage && productID) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                formData.append('category', productForm.category);

                const uploadRes = await fetch(`/api/products/${productID}/image`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    console.warn('Image upload failed, but product was created');
                }
            }

            setSelectedImage(null);
            setImagePreview('');
            navigate('/inventory');
        } catch (error) {
            console.error(error);
            setFormError(error.message);
        }
    };

    //PRODUCT (DRINKS) HANDLERS
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

    //PRODUCT (FLAVORED ITEMS ) HANDLER
    const handleFlavorChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };

    const handleAddFlavorRow = () => {
        setProductForm(prev => ({
            ...prev,
            flavors: [...prev.flavors, { flavorName: '', price: '' }]
        }));
    };

    const handleRemoveFlavorRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.filter((_, i) => i !== index)
        }));
    };

    const handleFlavorIngredientChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavorIngredients: prev.flavorIngredients.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };

    const handleFlavorIngredientQuantityChange = (ingredientIndex, flavorName) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavorIngredients: prev.flavorIngredients.map((row, i) =>
                i === ingredientIndex
                    ? { ...row, quantities: { ...row.quantities, [flavorName]: event.target.value } }
                    : row
            )
        }));
    };

    const handleAddFlavorIngredientRow = () => {
        setProductForm(prev => ({
            ...prev,
            flavorIngredients: [...prev.flavorIngredients, { ingredientID: '', quantities: {} }]
        }));
    };

    const handleRemoveFlavorIngredientRow = (index) => {
        setProductForm(prev => ({
            ...prev,
            flavorIngredients: prev.flavorIngredients.filter((_, i) => i !== index)
        }));
    };

    const getAvailableFlavorIngredients = (currentIndex) => {
        const selectedIDs = productForm.flavorIngredients
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
                                <button className = "back-button" onClick = {handleToggle}>Toggle Product/Ingredient</button>
                                <button className = "back-button" type = "button" onClick = {() => navigate('/inventory')}> Back </button>
                            </div>
                        </div>  
                        <hr />
                        <div className = "form-question">
                            <label>Enter Product Name: </label>
                            <div className = "form-answer">
                                <input 
                                    type = "text"
                                    placeholder = "Enter Product Name"
                                    value = {productForm.productName}
                                    onChange = {handleProductForm('productName')}
                                    required />
                            </div>
                        </div>
                        <div className = "form-question">
                            <label>Select Category: </label>
                            <div className = "form-answer">
                                <select value = {productForm.category} onChange = {handleProductForm('category')} required>
                                    <option value = "">Select Category</option>
                                    {categories.map(category => (
                                        <option key = {category} value = {category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className = "form-question">
                            <label>Select Image: </label>
                            <div className = "form-answer">
                                <input 
                                    type = "file"
                                    accept = "image/*"
                                    onChange = {handleImageChange}
                                />
                                {imagePreview && (
                                    <div>
                                        <img
                                            src = {imagePreview}
                                            alt = "Product Preview"
                                            style = {{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px' }}
                                        />
                                        <button 
                                            type = "button" 
                                            onClick = {handleRemoveImage}
                                            style = {{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="button" className = "addAddOnButton" onClick={handleAddAddOnRow}>Add Add-On</button>
                        {productForm.addOns.map((row, index) => (
                        <div className = "form-question">
                            <label>Select all the add-ons available for this product: </label>
                            <div key={index} className="addproduct-addon-row">
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
                        <div className = "form-question">
                            <label>Select Product Type (Cannot be changed later): </label>
                            <div className = "form-answer">
                                <select value = {productForm.productType} onChange = {handleProductForm('productType')}>
                                    <option value = "">Select Product Type</option>
                                    <option value = "simpleProduct">Meals</option> {/*SIMPLE PRODUCTS SA DATABASE, BUT CALLED MEALS HERE FOR CLARITY*/}
                                    <option value = "drink">Drinks</option>
                                    <option value = "flavoredItem">Flavored Foods (Ex. Fries)</option>
                                </select>
                            </div>
                        </div>

                        <br /><hr />

                        {/*DIFFERENT QUESTIONS APPEAR DEPENDING ON PRODUCT TYPE*/}

                        {/*ADDITIONAL QUESTIONS FOR SIMPLE PRODUCTS*/}
                        {productForm.productType === 'simpleProduct' && (
                            <div className = "more-questions-container">
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
                                <button type = "button" className = "addAddOnButton" onClick = {handleAddIngredientRow}>Add Ingredient</button>
                                {productForm.ingredients.map((row, index) => (
                                    <div key = {index} className = "form-question">
                                        <label>Select the ingreidients this product uses (w/ quantities): </label>
                                        <div className = "form-answer">
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
                                                <button type = "button" className = "addpro-remove-button" onClick = {() => handleRemoveIngredientRow(index)}>Remove</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {formError && (
                                    <p style={{ color: 'red', textAlign: 'center', marginTop: '8px' }}>{formError}</p>
                                )}
                                <button class = "addAddOnButton" type="button" onClick={handleSubmitProduct}>Submit Product</button>
                            </div>
                        )}

                        {/*ADDITIONAL QUESTIONS FOR DRINKS */}
                        {productForm.productType === 'drink' && (
                            <div className = "more-questions-container">
                                <button className = "addAddOnButton" type="button" onClick={handleAddSizeRow}>Add Size</button>
                                    {productForm.priceAndSize.map((row, index) => (
                                        <div className="form-question">
                                            <label>Sizes and Prices:</label>
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
                                        </div>
                                    ))}
                                
                                <button type="button" className = "addAddOnButton" onClick={handleAddDrinkIngredientRow}>Add Ingredient</button>
                                <p className = "ingredientsLabel">Select ingredients and quantity required for each size</p>
                                {productForm.drinkIngredients.map((row, index) => {
                                    const sizes = productForm.priceAndSize.filter(s => s.size !== '');
                                    return (
                                        <div className = "addIngredientsSectionDrinks" key={index}>
                                            {sizes.length === 0 ? (
                                                <div className="drink-ingredient-row">
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
                                                    {productForm.drinkIngredients.length > 1 && (
                                                        <button className="remove-row-ingredients" type="button" onClick={() => handleRemoveDrinkIngredientRow(index)}> - </button>
                                                    )}
                                                </div>
                                            ) : (
                                                sizes.map((s, sizeIndex) => (
                                                    <div key={sizeIndex} className="drink-ingredient-row">
                                                        {sizeIndex === 0 ? (
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
                                                        ) : (
                                                            <span className="ingredient-select-spacer"></span>
                                                        )}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder={`Qty for ${s.size}`}
                                                            value={row.quantities?.[s.size] || ''}
                                                            onChange={handleDrinkIngredientQuantityChange(index, s.size)} />
                                                        {productForm.drinkIngredients.length > 1 && sizeIndex === 0 ? (
                                                            <button className="remove-row-ingredients" type="button" onClick={() => handleRemoveDrinkIngredientRow(index)}>-</button>
                                                        ) : (
                                                            <span className="ingredient-button-spacer"></span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                })}
                                {formError && (
                                    <p style={{ color: 'red', textAlign: 'center', marginTop: '8px' }}>{formError}</p>
                                )}
                                <button className="addAddOnButton" type="button" onClick={handleSubmitProduct}>
                                    Submit Product
                                </button>
                            </div>
                        )}

                        {/*ADDITIONAL QUESTIONS FOR FLAVORED ITEMS*/}
                        {productForm.productType === 'flavoredItem' && (
                            <div className = "more-questions-container">
                                <button type="button" className = "addAddOnButton" onClick={handleAddFlavorRow}>Add Flavor</button>
                                    {productForm.flavors.map((row, index) => (
                                        <div className="form-question">
                                            <label>Flavors and Prices:</label>
                                            <div key={index} className="size-row">
                                                <input
                                                    type="text"
                                                    placeholder="Flavor Name (e.g. Cheese)"
                                                    value={row.flavorName}
                                                    onChange={handleFlavorChange(index, 'flavorName')} />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={row.price}
                                                    onChange={handleFlavorChange(index, 'price')} />
                                                {productForm.flavors.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveFlavorRow(index)}>Remove</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                <button type="button" className="addAddOnButton" onClick={handleAddFlavorIngredientRow}>Add Ingredient</button>
                                <p className="ingredientsLabel">Select ingredients and quantity required for each flavor</p>

                                {productForm.flavorIngredients.map((row, index) => {
                                    const flavors = productForm.flavors.filter(f => f.flavorName !== '');
                                    return (
                                        <div className="addIngredientsSectionDrinks" key={index}>
                                            {flavors.length === 0 ? (
                                                <div className="drink-ingredient-row">
                                                    <select
                                                        value={row.ingredientID}
                                                        onChange={handleFlavorIngredientChange(index, 'ingredientID')}>
                                                        <option value="">Select Ingredient</option>
                                                        {getAvailableFlavorIngredients(index).map(ingredient => (
                                                            <option key={ingredient.ingredientID} value={ingredient.ingredientID}>
                                                                {ingredient.ingredientName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {productForm.flavorIngredients.length > 1 && (
                                                        <button className="remove-row-ingredients" type="button" onClick={() => handleRemoveFlavorIngredientRow(index)}>-</button>
                                                    )}
                                                </div>
                                            ) : (
                                                flavors.map((f, flavorIndex) => (
                                                    <div key={flavorIndex} className="drink-ingredient-row">
                                                        {flavorIndex === 0 ? (
                                                            <select
                                                                value={row.ingredientID}
                                                                onChange={handleFlavorIngredientChange(index, 'ingredientID')}>
                                                                <option value="">Select Ingredient</option>
                                                                {getAvailableFlavorIngredients(index).map(ingredient => (
                                                                    <option key={ingredient.ingredientID} value={ingredient.ingredientID}>
                                                                        {ingredient.ingredientName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className="ingredient-select-spacer"></span>
                                                        )}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder={`Qty for ${f.flavorName}`}
                                                            value={row.quantities?.[f.flavorName] || ''}
                                                            onChange={handleFlavorIngredientQuantityChange(index, f.flavorName)} />
                                                        {productForm.flavorIngredients.length > 1 && flavorIndex === 0 ? (
                                                            <button className="remove-row-ingredients" type="button" onClick={() => handleRemoveFlavorIngredientRow(index)}>-</button>
                                                        ) : (
                                                            <span className="ingredient-button-spacer"></span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                })}
                                {formError && (
                                    <p style={{ color: 'red', textAlign: 'center', marginTop: '8px' }}>{formError}</p>
                                )}
                                <button className="addAddOnButton" type="button" onClick={handleSubmitProduct}>
                                    Submit Product
                                </button>
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