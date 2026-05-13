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
                        ingredients: s.ingredients?.length > 0
                            ? s.ingredients.map(i => ({ ingredientID: String(i.ingredientID), quantityRequired: String(i.quantityRequired) }))
                            : [{ ingredientID: '', quantityRequired: '' }]
                    })) || [],
                    flavors: p.flavors?.map(f => ({
                        flavoredItemID: f.flavoredItemID,
                        flavorName: f.flavorName,
                        price: f.price,
                        ingredients: f.ingredients?.length > 0
                            ? f.ingredients.map(i => ({ ingredientID: String(i.ingredientID), quantityRequired: String(i.quantityRequired) }))
                            : [{ ingredientID: '', quantityRequired: '' }]
                    })) || [],
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
    const handleDrinkIngredientChange = (sizeIndex, ingredientIndex, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.map((size, si) =>
                si === sizeIndex ? {
                    ...size,
                    ingredients: size.ingredients.map((row, ii) =>
                        ii === ingredientIndex ? { ...row, [field]: event.target.value } : row
                    )
                } : size
            )
        }));
    };
    const handleAddDrinkIngredientRow = (sizeIndex) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.map((size, si) =>
                si === sizeIndex ? { ...size, ingredients: [...size.ingredients, { ingredientID: '', quantityRequired: '' }] } : size
            )
        }));
    };
    const handleRemoveDrinkIngredientRow = (sizeIndex, ingredientIndex) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.map((size, si) =>
                si === sizeIndex ? { ...size, ingredients: size.ingredients.filter((_, ii) => ii !== ingredientIndex) } : size
            )
        }));
    };
    const getAvailableDrinkIngredients = (sizeIndex, currentIngredientIndex) => {
        const selectedIDs = productForm.sizes[sizeIndex].ingredients
            .map((row, i) => i !== currentIngredientIndex ? row.ingredientID : null)
            .filter(id => id !== null && id !== '');
        return ingredientList.filter(ing => !selectedIDs.includes(String(ing.ingredientID)));
    };

    // Flavor ingrediente handlers
    const handleFlavorIngredientChange = (flavorIndex, ingredientIndex, field) => (event) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi === flavorIndex ? {
                    ...flavor,
                    ingredients: flavor.ingredients.map((row, ii) =>
                        ii === ingredientIndex ? { ...row, [field]: event.target.value } : row
                    )
                } : flavor
            )
        }));
    };
    const handleAddFlavorIngredientRow = (flavorIndex) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi === flavorIndex ? { ...flavor, ingredients: [...flavor.ingredients, { ingredientID: '', quantityRequired: '' }] } : flavor
            )
        }));
    };
    const handleRemoveFlavorIngredientRow = (flavorIndex, ingredientIndex) => {
        setProductForm(prev => ({
            ...prev,
            flavors: prev.flavors.map((flavor, fi) =>
                fi === flavorIndex ? { ...flavor, ingredients: flavor.ingredients.filter((_, ii) => ii !== ingredientIndex) } : flavor
            )
        }));
    };
    const getAvailableFlavorIngredients = (flavorIndex, currentIngredientIndex) => {
        const selectedIDs = productForm.flavors[flavorIndex].ingredients
            .map((row, i) => i !== currentIngredientIndex ? row.ingredientID : null)
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

        if (!productForm.productName.trim()) return setFormError('Product name is required.');
        if (!productForm.category) return setFormError('Category is required.');
        setFormError(null);

        try {
            const body = {
                productName: productForm.productName,
                category: productForm.category,
                imageURL: productForm.imageURL || null,
                addOns: productForm.addOns
                    .filter(a => a.addOnID !== '' && a.quantityRequired !== '')
                    .map(a => ({ addOnID: Number(a.addOnID), quantityRequired: Number(a.quantityRequired) })),
            };

            if (productForm.productType === 'simpleProduct') {
                body.price = Number(productForm.price);
                body.ingredients = productForm.ingredients
                    .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                    .map(i => ({ ingredientID: Number(i.ingredientID), quantityRequired: Number(i.quantityRequired) }));
            } else if (productForm.productType === 'drink') {
                body.sizes = productForm.sizes.map(s => ({
                    drinkID: s.drinkID,
                    ingredients: s.ingredients
                        .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                        .map(i => ({ ingredientID: Number(i.ingredientID), quantityRequired: Number(i.quantityRequired) }))
                }));
            } else if (productForm.productType === 'flavoredItem') {
                body.flavors = productForm.flavors.map(f => ({
                    flavoredItemID: f.flavoredItemID,
                    ingredients: f.ingredients
                        .filter(i => i.ingredientID !== '' && i.quantityRequired !== '')
                        .map(i => ({ ingredientID: Number(i.ingredientID), quantityRequired: Number(i.quantityRequired) }))
                }));
            }

            const response = await fetch(`/api/products/${productID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('Failed to update product.');
            navigate('/inventory');
        } catch (error) {
            console.error(error);
            setFormError('Something went wrong. Please try again.');
        }
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
                            {productForm.sizes.map((size, sizeIndex) => (
                                <div key={sizeIndex}>
                                    <p className="ingredientsLabel">{size.size} — ₱{size.price}</p>
                                    <button type="button" className="addAddOnButton" onClick={() => handleAddDrinkIngredientRow(sizeIndex)}>Add Ingredient</button>
                                    {size.ingredients.map((row, ingredientIndex) => (
                                        <div key={ingredientIndex} className="form-question">
                                            <label>Ingredient: </label>
                                            <div className="form-answer">
                                                <select
                                                    value={row.ingredientID}
                                                    onChange={handleDrinkIngredientChange(sizeIndex, ingredientIndex, 'ingredientID')}>
                                                    <option value="">Select Ingredient</option>
                                                    {getAvailableDrinkIngredients(sizeIndex, ingredientIndex).map(ing => (
                                                        <option key={ing.ingredientID} value={ing.ingredientID}>{ing.ingredientName}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    placeholder="Quantity"
                                                    value={row.quantityRequired}
                                                    onChange={handleDrinkIngredientChange(sizeIndex, ingredientIndex, 'quantityRequired')} />
                                                {size.ingredients.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveDrinkIngredientRow(sizeIndex, ingredientIndex)}>Remove</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* FLAVORED ITEM */}
                    {productForm.productType === 'flavoredItem' && (
                        <div className="more-questions-container">
                            {productForm.flavors.map((flavor, flavorIndex) => (
                                <div key={flavorIndex}>
                                    <p className="ingredientsLabel">{flavor.flavorName} — ₱{flavor.price}</p>
                                    <button type="button" className="addAddOnButton" onClick={() => handleAddFlavorIngredientRow(flavorIndex)}>Add Ingredient</button>
                                    {flavor.ingredients.map((row, ingredientIndex) => (
                                        <div key={ingredientIndex} className="form-question">
                                            <label>Ingredient: </label>
                                            <div className="form-answer">
                                                <select
                                                    value={row.ingredientID}
                                                    onChange={handleFlavorIngredientChange(flavorIndex, ingredientIndex, 'ingredientID')}>
                                                    <option value="">Select Ingredient</option>
                                                    {getAvailableFlavorIngredients(flavorIndex, ingredientIndex).map(ing => (
                                                        <option key={ing.ingredientID} value={ing.ingredientID}>{ing.ingredientName}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    placeholder="Quantity"
                                                    value={row.quantityRequired}
                                                    onChange={handleFlavorIngredientChange(flavorIndex, ingredientIndex, 'quantityRequired')} />
                                                {flavor.ingredients.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveFlavorIngredientRow(flavorIndex, ingredientIndex)}>Remove</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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