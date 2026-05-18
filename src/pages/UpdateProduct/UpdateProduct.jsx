import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UpdateProduct.css';

function UpdateProduct() {
    const navigate = useNavigate();
    const { productID } = useParams();

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [ingredientList, setIngredientList] = useState([]);
    const [addOnsList, setAddOnsList] = useState([]);
    const [formError, setFormError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageRemoved, setImageRemoved] = useState(false);

    const [productForm, setProductForm] = useState({
        productName: '',
        category: '',
        productType: '',
        imageURL: '',

        // simpleProduct
        price: '',
        ingredients: [{ ingredientID: '', quantityRequired: '' }],

        // drink
        sizes: [],
        drinkIngredients: [{ ingredientID: '', quantities: {} }],

        // flavoredItem
        flavors: [],
        
        // all
        addOns: [{ addOnID: '', quantityRequired: '' }],
    });

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [productRes, categoriesRes, ingredientsRes, addOnsRes] = await Promise.all([
                    fetch(`/api/products/${productID}`),
                    fetch('/api/products/categories'),
                    fetch('/api/ingredients'),
                    fetch('/api/addons'),
                ]);

                const productData = await productRes.json();
                const categoriesData = await categoriesRes.json();
                const ingredientsData = await ingredientsRes.json();
                const addOnsData = await addOnsRes.json();

                setCategories(categoriesData.data);
                setIngredientList(ingredientsData.ingredients);
                setAddOnsList(addOnsData.addOns);

                const p = productData.data;

                setImagePreview(p.imageURL || '');

                const buildDrinkIngredients = (sizes) => {
                    const map = new Map();

                    for (const size of sizes || []) {
                        for (const ingredient of size.ingredients || []) {
                            const key = String(ingredient.ingredientID);
                            const existing = map.get(key);
                            if (existing) {
                                existing.quantities[size.size] = String(ingredient.quantityRequired);
                            } else {
                                map.set(key, {
                                    ingredientID: String(ingredient.ingredientID),
                                    quantities: { [size.size]: String(ingredient.quantityRequired) },
                                });
                            }
                        }
                    }

                    return map.size > 0
                        ? Array.from(map.values())
                        : [{ ingredientID: '', quantities: {} }];
                };

                const buildVariantIngredients = (variants, idKey) => {
                    const map = new Map();

                    for (const variant of variants || []) {
                        for (const ingredient of variant.ingredients || []) {
                            const ingredientID = String(ingredient.ingredientID);
                            const existing = map.get(ingredientID);

                            if (existing) {
                                existing.quantities[variant[idKey]] = String(ingredient.quantityRequired);
                            } else {
                                map.set(ingredientID, {
                                    ingredientID,
                                    quantities: { [variant[idKey]]: String(ingredient.quantityRequired) },
                                });
                            }
                        }
                    }

                    return map.size > 0
                        ? Array.from(map.values())
                        : [{ ingredientID: '', quantities: {} }];
                };

                setProductForm({
                    productName: p.productName,
                    category: p.category,
                    productType: p.productType,
                    imageURL: p.imageURL || '',
                    price: p.price || '',
                    ingredients: p.ingredients?.length > 0
                        ? p.ingredients.map(i => ({ ingredientID: String(i.ingredientID), quantityRequired: String(i.quantityRequired) }))
                        : [{ ingredientID: '', quantityRequired: '' }],
                    sizes: p.sizes?.map(s => ({
                        drinkID: s.drinkID,
                        size: s.size,
                        price: s.price,
                    })) || [],
                    drinkIngredients: buildVariantIngredients(p.sizes, 'drinkID'),
                    flavors: p.flavors?.map(f => ({
                        flavoredItemID: f.flavoredItemID,
                        flavorName: f.flavorName,
                        price: f.price,
                        ingredients: f.ingredients?.length > 0
                            ? f.ingredients.map(i => ({
                                ingredientID: String(i.ingredientID),
                                quantityRequired: String(i.quantityRequired),
                            }))
                            : [{ ingredientID: '', quantityRequired: '' }],
                    })) || [],
                    flavorIngredients: buildVariantIngredients(p.flavors, 'flavoredItemID'),
                    addOns: p.addOns?.length > 0
                        ? p.addOns.map(a => ({ addOnID: String(a.addOnID), quantityRequired: String(a.quantityRequired) }))
                        : [{ addOnID: '', quantityRequired: '' }],
                });
            } catch (error) {
                console.error('Failed to load product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [productID]);

    const handleProductForm = (field) => (event) => {
        setProductForm(prev => ({ ...prev, [field]: event.target.value }));
    };

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
        setImageRemoved(true);
    };

    // Simple product ingredient handlers
    const handleIngredientChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };
    const handleAddIngredientRow = () => {
        setProductForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { ingredientID: '', quantityRequired: '' }] }));
    };
    const handleRemoveIngredientRow = (index) => {
        setProductForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
    };
    const getAvailableIngredients = (currentIndex) => {
        const selectedIDs = productForm.ingredients
            .map((row, i) => i !== currentIndex ? row.ingredientID : null)
            .filter(id => id !== null && id !== '');
        return ingredientList.filter(ing => !selectedIDs.includes(String(ing.ingredientID)));
    };

    // Drink ingredient handlers
    const handleDrinkIngredientChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: prev.drinkIngredients.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
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

        return ingredientList.filter(ing => !selectedIDs.includes(String(ing.ingredientID)));
    };

    // Add-On handlers
    const handleAddOnChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            addOns: prev.addOns.map((row, i) =>
                i === index ? { ...row, [field]: event.target.value } : row
            )
        }));
    };
    const handleAddAddOnRow = () => {
        setProductForm(prev => ({ ...prev, addOns: [...prev.addOns, { addOnID: '', quantityRequired: '' }] }));
    };
    const handleRemoveAddOnRow = (index) => {
        setProductForm(prev => ({ ...prev, addOns: prev.addOns.filter((_, i) => i !== index) }));
    };
    const getAvailableAddOns = (currentIndex) => {
        const selectedIDs = productForm.addOns
            .map((row, i) => i !== currentIndex ? row.addOnID : null)
            .filter(id => id !== null && id !== '');
        return addOnsList.filter(a => !selectedIDs.includes(String(a.addOnID)));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError(null);

        try {
            let imageURL = productForm.imageURL;

            if (imageRemoved) {
                imageURL = '';
            } 

            else if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                formData.append('category', productForm.category);

                const uploadRes = await fetch(`/api/products/${productID}/image`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload image');
                }

                const uploadData = await uploadRes.json();
                imageURL = uploadData.imageURL;
            }

            const updateData = {
                productName: productForm.productName,
                category: productForm.category,
                imageURL,
                addOns: productForm.addOns
                    .filter(a => a.addOnID !== '' && a.quantityRequired !== '')
                    .map(a => ({ addOnID: Number(a.addOnID), quantityRequired: Number(a.quantityRequired) })),
            };

            if (productForm.productType === 'simpleProduct') {
                updateData.price = Number(productForm.price);
                updateData.ingredients = productForm.ingredients
                    .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                    .map(i => ({ ingredientID: Number(i.ingredientID), quantityRequired: Number(i.quantityRequired) }));
            } else if (productForm.productType === 'drink') {
                updateData.sizes = productForm.sizes.map(size => ({
                    drinkID: size.drinkID,
                    size: size.size,
                    price: Number(size.price),
                    ingredients: productForm.drinkIngredients
                        .filter(row => row.ingredientID !== '' && row.quantities?.[size.drinkID] !== '')
                        .map(row => ({
                            ingredientID: Number(row.ingredientID),
                            quantityRequired: Number(row.quantities[size.drinkID])
                        }))
                }));
            } else if (productForm.productType === 'flavoredItem') {
                updateData.flavors = productForm.flavors.map(flavor => ({
                    flavoredItemID: flavor.flavoredItemID,
                    flavorName: flavor.flavorName,
                    price: Number(flavor.price),
                    ingredients: flavor.ingredients
                        .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                        .map(i => ({
                            ingredientID: Number(i.ingredientID),
                            quantityRequired: Number(i.quantityRequired),
                        }))
                }));
            }
            const res = await fetch(`/api/products/${productID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                throw new Error('Failed to update product');
            }

            setImageRemoved(false);
            setSelectedImage(null);
            navigate('/inventory');
        } catch (error) {
            setFormError(error.message);
        }
    };

    const getIngredientName = (ingredientID) => {
        return ingredientList.find(ing => String(ing.ingredientID) === String(ingredientID))?.ingredientName || '';
    };

    const handleSizeFieldChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.map((size, i) =>
                i === index ? { ...size, [field]: event.target.value } : size
            )
        }));
    };

    const handleFlavorFieldChange = (index, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, i) =>
                i === index ? { ...flavor, [field]: event.target.value } : flavor
            )
        }));
    };

    const handleDrinkIngredientQuantityChange = (index, drinkID) => (event) => {
        const value = event.target.value;
        setProductForm(prev => ({
            ...prev,
            drinkIngredients: prev.drinkIngredients.map((row, i) =>
                i === index
                    ? { ...row, quantities: { ...row.quantities, [drinkID]: value } }
                    : row
            )
        }));
    };

    const handleFlavorIngredientChange = (flavorIndex, ingredientIndex, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi !== flavorIndex ? flavor : {
                    ...flavor,
                    ingredients: flavor.ingredients.map((row, ii) =>
                        ii !== ingredientIndex ? row : { ...row, [field]: event.target.value }
                    )
                }
            )
        }));
    };

    const handleFlavorIngredientQuantityChange = (index, flavorID) => (event) => {
        const value = event.target.value;
        setProductForm(prev => ({
            ...prev,
            flavorIngredients: prev.flavorIngredients.map((row, i) =>
                i === index
                    ? { ...row, quantities: { ...row.quantities, [flavorID]: value } }
                    : row
            )
        }));
    };

    const handleAddFlavorIngredientRow = (flavorIndex) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi !== flavorIndex ? flavor : {
                    ...flavor,
                    ingredients: [...flavor.ingredients, { ingredientID: '', quantityRequired: '' }]
                }
            )
        }));
    };

    const handleRemoveFlavorIngredientRow = (flavorIndex, ingredientIndex) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi !== flavorIndex ? flavor : {
                    ...flavor,
                    ingredients: flavor.ingredients.filter((_, ii) => ii !== ingredientIndex)
                }
            )
        }));
    };

    const getAvailableFlavorIngredients = (flavorIndex, currentIngredientIndex) => {
        const selectedIDs = productForm.flavors[flavorIndex]?.ingredients
            .map((row, i) => i !== currentIngredientIndex ? row.ingredientID : null)
            .filter(id => id !== null && id !== '');
        return ingredientList.filter(ing => !selectedIDs.includes(String(ing.ingredientID)));
    };

    if (loading) return <div className="update-product-container"><p>Loading...</p></div>;

    return (
        <div className="update-product-container">
            <div className="update-product-form-wrapper">
                <form>
                    <div className="form-header">
                        <h2>Update Product</h2>
                        <button className="back-button" type="button" onClick={() => navigate('/inventory')}>Back</button>
                    </div>
                    <hr />

                    {/* QUESTION PRODUCT NAME */}
                    <div className="form-question">
                        <label>Product Name: </label>
                        <div className="form-answer">
                            <input
                                type="text"
                                value={productForm.productName}
                                onChange={handleProductForm('productName')}
                                required />
                        </div>
                    </div>

                    {/* CATEGORY */}
                    <div className="form-question">
                        <label>Category: </label>
                        <div className="form-answer">
                            <select value={productForm.category} onChange={handleProductForm('category')}>
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* CHANGE IMAGE */}
                    <div className="form-question">
                        <label>Image: </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ADD-ONS */}
                    <button type="button" className="addAddOnButton" onClick={handleAddAddOnRow}>Add Add-On</button>
                    {productForm.addOns.map((row, index) => (
                        <div key={index} className="form-question">
                            <label>Add-Ons: </label>
                            <div className="addproduct-addon-row">
                                <select value={row.addOnID} onChange={handleAddOnChange(index, 'addOnID')}>
                                    <option value="">Select Add-On</option>
                                    {getAvailableAddOns(index).map(addOn => (
                                        <option key={addOn.addOnID} value={addOn.addOnID}>{addOn.addOnName}</option>
                                    ))}
                                </select>
                                <input
                                    type="number" min="0" step="0.01"
                                    placeholder="Quantity required"
                                    value={row.quantityRequired}
                                    onChange={handleAddOnChange(index, 'quantityRequired')} />
                                {productForm.addOns.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveAddOnRow(index)}>Remove</button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* PRODUCT TYPE LABEL */}
                    <div className="form-question">
                        <label>Product Type (Cannot No Longer Be Changed): </label>
                        <span>{productForm.productType}</span>
                    </div>

                    <br /><hr />

                    {/* SIMPLE PRODUCT */}
                    {productForm.productType === 'simpleProduct' && (
                        <div className="more-questions-container">
                            <div className="form-question">
                                <label>Price: </label>
                                <input
                                    type="number" min="0" step="0.01"
                                    value={productForm.price}
                                    onChange={handleProductForm('price')} />
                            </div>
                            <button type="button" className="addAddOnButton" onClick={handleAddIngredientRow}>Add Ingredient</button>
                            {productForm.ingredients.map((row, index) => (
                                <div key={index} className="form-question">
                                    <label>Ingredients: </label>
                                    <div className="form-answer">
                                        <select value={row.ingredientID} onChange={handleIngredientChange(index, 'ingredientID')}>
                                            <option value="">Select Ingredient</option>
                                            {getAvailableIngredients(index).map(ing => (
                                                <option key={ing.ingredientID} value={ing.ingredientID}>{ing.ingredientName}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number" min="0" step="0.01"
                                            placeholder="Quantity"
                                            value={row.quantityRequired}
                                            onChange={handleIngredientChange(index, 'quantityRequired')} />
                                        {productForm.ingredients.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveIngredientRow(index)}>Remove</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* DRINK */}
                    {productForm.productType === 'drink' && (
                        <div className="more-questions-container">
                            <button type="button" className="addAddOnButton" onClick={handleAddDrinkIngredientRow}>
                                Add Ingredient
                            </button>

                            {productForm.drinkIngredients.map((row, index) => (
                                <div key={index} className="form-question">
                                    <label>Ingredient:</label>
                                    <div className="form-answer">
                                        <select value={row.ingredientID} onChange={handleDrinkIngredientChange(index, 'ingredientID')}>
                                            <option value="">Select Ingredient</option>
                                            {getAvailableDrinkIngredients(index).map(ing => (
                                                <option key={ing.ingredientID} value={ing.ingredientID}>
                                                    {ing.ingredientName}
                                                </option>
                                            ))}
                                        </select>
                                        {productForm.drinkIngredients.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveDrinkIngredientRow(index)}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {productForm.sizes.map((size, sizeIndex) => (
                                <> 
                                    <hr />
                                    <div key={size.drinkID} className="size-block">
                                        <div className="form-question">
                                            <label>Size and Price:</label>
                                            <div className="form-answer">
                                                <input
                                                    type="text"
                                                    placeholder="Size name"
                                                    value={size.size}
                                                    onChange={handleSizeFieldChange(sizeIndex, 'size')}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={size.price}
                                                    onChange={handleSizeFieldChange(sizeIndex, 'price')}
                                                />
                                            </div>
                                        </div>
                                        <label>Enter quantity for the following ingredients: </label>
                                        {productForm.drinkIngredients.map((row, ingredientIndex) => (
                                            <div key={ingredientIndex} className="form-question">
                                                <label>{getIngredientName(row.ingredientID) || 'Ingredient qty'}:</label>
                                                <div className="form-answer">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder={`Qty for ${size.size}`}
                                                        value={row.quantities?.[size.drinkID] || ''}
                                                        onChange={handleDrinkIngredientQuantityChange(ingredientIndex, size.drinkID)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ))}
                        </div>
                    )}

                    {/* FLAVORED ITEM */}
                    {productForm.productType === 'flavoredItem' && (
                        <div className="more-questions-container">
                            {productForm.flavors.map((flavor, flavorIndex) => (
                                <div key={flavor.flavoredItemID}>
                                    <hr />
                                    <div className="size-block">
                                        <div className="form-question">
                                            <label>Flavor Name and Price: </label>
                                            <div className="form-answer">
                                                <input
                                                    type="text"
                                                    placeholder="Flavor name"
                                                    value={flavor.flavorName}
                                                    onChange={handleFlavorFieldChange(flavorIndex, 'flavorName')}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={flavor.price}
                                                    onChange={handleFlavorFieldChange(flavorIndex, 'price')}
                                                />
                                            </div>
                                        </div>

                                        <label>Ingredients for {flavor.flavorName || 'this flavor'}:</label>
                                        <button
                                            type="button"
                                            className="addAddOnButton"
                                            onClick={() => handleAddFlavorIngredientRow(flavorIndex)}
                                        >
                                            Add Ingredient
                                        </button>

                                        {flavor.ingredients.map((row, ingredientIndex) => (
                                            <div key={ingredientIndex} className="form-question">
                                                <label>Ingredient:</label>
                                                <div className="form-answer">
                                                    <select
                                                        value={row.ingredientID}
                                                        onChange={handleFlavorIngredientChange(flavorIndex, ingredientIndex, 'ingredientID')}
                                                    >
                                                        <option value="">Select Ingredient</option>
                                                        {getAvailableFlavorIngredients(flavorIndex, ingredientIndex).map(ing => (
                                                            <option key={ing.ingredientID} value={ing.ingredientID}>
                                                                {ing.ingredientName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Quantity"
                                                        value={row.quantityRequired}
                                                        onChange={handleFlavorIngredientChange(flavorIndex, ingredientIndex, 'quantityRequired')}
                                                    />
                                                    {flavor.ingredients.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFlavorIngredientRow(flavorIndex, ingredientIndex)}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {formError && <p style={{ color: 'red', textAlign: 'center' }}>{formError}</p>}
                    <button className="addAddOnButton" type="button" onClick={handleSubmit}>Save Changes</button>
                </form>
            </div>
        </div>
    );
}

export default UpdateProduct;