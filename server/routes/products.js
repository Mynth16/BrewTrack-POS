import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProductMenu, getProductVariants, getAvailableAddOns, getProductCategories, addProduct, addSimpleProduct, addProductIngredients, addProductAddOns, addDrink, addDrinkIngredients, addFlavoredItem, addFlavoredItemIngredients, getProductByID, getSimpleProductByProductID, getProductIngredientsbyProductID, getProductAddOnsByProductID, getDrinkIngredientsByProductID, getFlavoredItemIngredientsByProductID, updateProductBase, updateSimpleProductPrice, replaceProductIngredients, replaceProductAddOns, replaceDrinkIngredients, replaceFlavoredItemIngredients} from '../db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCTS_IMAGE_DIR = path.join(__dirname, '../..', 'src/products');

/**
 * Transform database product to API format
 */
async function transformProduct(dbProduct) {
    const { productID, productName, productType, category, basePrice, variantCount, imageURL } = dbProduct;

    let sizes = [];
    let addOns = [];

    try {
        // Fetch variants (sizes/flavors) for this product
        const variants = await getProductVariants(productID);
        
        if (productType === 'drink' && Array.isArray(variants)) {
            // Map drink sizes to sizes array
            sizes = variants.map(v => ({
                label: v.variantName || v.size || v.displayLabel,
                price: parseFloat(v.price),
            }));
        } else if (productType === 'flavoredItem' && Array.isArray(variants)) {
            // Map flavors to sizes array (frontend doesn't distinguish between sizes and flavors)
            sizes = variants.map(v => ({
                label: v.variantName || v.flavorName || v.displayLabel,
                price: parseFloat(v.price),
            }));
        } else if (productType === 'simpleProduct') {
            // Simple products have a single price, no sizes
            sizes = [{
                label: 'Standard',
                price: parseFloat(basePrice),
            }];
        }

        // Fetch available add-ons for this product
        const addOnList = await getAvailableAddOns(productID);
        if (Array.isArray(addOnList)) {
            addOns = addOnList.map(a => ({
                id: a.addOnID,
                name: a.addOnName,
                price: parseFloat(a.addOnPrice),
            }));
        }
    } catch (error) {
        console.error(`Error transforming product ${productID}:`, error);
        // Provide fallback sizes if fetch fails
        sizes = [{
            label: 'Standard',
            price: parseFloat(basePrice),
        }];
    }

    return {
        productID,
        id: productID,
        name: productName,
        productName,
        description: '',
        category,
        categoryID: category, // Use category as ID for now
        price: parseFloat(basePrice),
        basePrice: parseFloat(basePrice),
        sizes,
        addOns,
        stock: 100, // Default to 100 (unlimited for POS)
        image: imageURL || '/src/products/default.png',
        imageURL,
        productType,
        variantCount,
    };
}

router.get('/categories', async (req, res) => {
    try {
        const categories = await getProductCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error getting all distinct categories: ', error);
        res.status(500).json({ success: false, error: 'Error getting all distinct categories'});
    }
})

/**
 * GET /api/products
 * Returns all products, categories, and add-ons
 */
router.get('/', async (req, res) => {
    try {
        const dbProducts = await getProductMenu();
        
        // Transform products
        const transformedProducts = await Promise.all(
            dbProducts.map(p => transformProduct(p))
        );

        // Extract unique categories
        const categoriesMap = new Map();
        transformedProducts.forEach(product => {
            const categoryID = product.categoryID;
            const categoryName = product.category;
            if (!categoriesMap.has(categoryID)) {
                categoriesMap.set(categoryID, {
                    categoryID,
                    id: categoryID,
                    categoryName,
                    name: categoryName,
                });
            }
        });
        const categories = Array.from(categoriesMap.values());

        res.json({
            success: true,
            data: {
                categories,
                products: transformedProducts,
                addOns: [],
            },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            message: error.message,
        });
    }
});

/**
 * GET /api/products/:productId/addons
 * Returns available add-ons for a specific product
 */
router.get('/:productId/addons', async (req, res) => {
    try {
        const { productId } = req.params;
        const addOns = await getAvailableAddOns(productId);

        res.json({
            success: true,
            data: addOns,
        });
    } catch (error) {
        console.error('Error fetching add-ons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch add-ons',
            message: error.message,
        });
    }
});

/**
 * GET /api/products/images/categories
 * Returns list of all available image categories
 */
router.get('/images/categories', (req, res) => {
    try {
        const categories = fs.readdirSync(PRODUCTS_IMAGE_DIR)
            .filter(item => {
                const itemPath = path.join(PRODUCTS_IMAGE_DIR, item);
                return fs.statSync(itemPath).isDirectory();
            })
            .sort();

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Error fetching image categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch image categories',
            message: error.message,
        });
    }
});

/**
 * GET /api/products/images/:category
 * Returns list of available images in a specific category folder
 */
router.get('/images/:category', (req, res) => {
    try {
        const { category } = req.params;
        const categoryPath = path.join(PRODUCTS_IMAGE_DIR, decodeURIComponent(category));

        // Security check: ensure the path is within PRODUCTS_IMAGE_DIR
        if (!categoryPath.startsWith(PRODUCTS_IMAGE_DIR)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category',
            });
        }

        // Check if directory exists
        if (!fs.existsSync(categoryPath)) {
            return res.status(404).json({
                success: false,
                error: 'Category not found',
            });
        }

        // Get all image files (jpg, png, webp, etc.)
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const images = fs.readdirSync(categoryPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .sort();

        const imageUrls = images.map(image => ({
            name: image,
            filename: path.basename(image, path.extname(image)),
            url: `/products/${encodeURIComponent(category)}/${encodeURIComponent(image)}`,
        }));

        res.json({
            success: true,
            category,
            data: imageUrls,
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch images',
            message: error.message,
        });
    }
});

router.post('/', async (req, res) => {
    const { productName, category, productType, price, ingredients, addOns, priceAndSize, drinkIngredients, flavors, flavorIngredients } = req.body;

    try {
        const productID = await addProduct(productName, productType, category, null);

        if (productType === 'simpleProduct') {
            await addSimpleProduct(productID, price);

            const validIngredients = ingredients.filter(i => i.ingredientID !== '' && i.quantityRequired !== '');
            if (validIngredients.length > 0) {
                await addProductIngredients(productID, validIngredients);
            }

        } else if (productType === 'drink') {
            const validSizes = priceAndSize.filter(s => s.size !== '' && s.price !== '');
            for (const sizeRow of validSizes) {
                const drinkID = await addDrink(productID, sizeRow.size, sizeRow.price);

                const validIngredients = drinkIngredients
                    .filter(i => i.ingredientID !== '' && i.quantities?.[sizeRow.size])
                    .map(i => ({
                        ingredientID: Number(i.ingredientID),
                        quantityRequired: Number(i.quantities[sizeRow.size])
                    }));

                if (validIngredients.length > 0) {
                    await addDrinkIngredients(drinkID, validIngredients);
                }
            }
        } else if (productType === 'flavoredItem') {
            const validFlavors = flavors.filter(f => f.flavorName !== '' && f.price !== '');
            for (const flavorRow of validFlavors) {
                const flavoredItemID = await addFlavoredItem(productID, flavorRow.flavorName, flavorRow.price);

                const validIngredients = flavorIngredients
                    .filter(i => i.ingredientID !== '' && i.quantities?.[flavorRow.flavorName])
                    .map(i => ({
                        ingredientID: Number(i.ingredientID),
                        quantityRequired: Number(i.quantities[flavorRow.flavorName])
                    }));

                if (validIngredients.length > 0) {
                    await addFlavoredItemIngredients(flavoredItemID, validIngredients);
                }
            }
        }

        // Add-ons apply to all product types
        const validAddOns = addOns.filter(a => a.addOnID !== '' && a.quantityRequired !== '');
        if (validAddOns.length > 0) {
            await addProductAddOns(productID, validAddOns);
        }

        res.status(201).json({ success: true, productID });
    } catch (error) {
        console.error('Failed to add product: ', error);
        res.status(500).json({ success: false, error: 'Failed to add product' });
    }
});

router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await getProductByID(productId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        const addOns = await getProductAddOnsByProductID(productId);
        let typeData = {};

        if (product.productType === 'simpleProduct') {
            const simple = await getSimpleProductByProductID(productId);
            const ingredients = await getProductIngredientsbyProductID(productId);
            typeData = { price: simple?.price, ingredients };

        } else if (product.productType === 'drink') {
            const rows = await getDrinkIngredientsByProductID(productId);
            const sizesMap = {};
            for (const row of rows) {
                if (!sizesMap[row.size]) {
                    sizesMap[row.size] = { drinkID: row.drinkID, size: row.size, price: row.price, ingredients: [] };
                }
                if (row.ingredientID) {
                    sizesMap[row.size].ingredients.push({
                        ingredientID: row.ingredientID,
                        ingredientName: row.ingredientName,
                        quantityRequired: row.quantityRequired
                    });
                }
            }
            typeData = { sizes: Object.values(sizesMap) };

        } else if (product.productType === 'flavoredItem') {
            const rows = await getFlavoredItemIngredientsByProductID(productId);
            const flavorsMap = {};
            for (const row of rows) {
                if (!flavorsMap[row.flavorName]) {
                    flavorsMap[row.flavorName] = { flavoredItemID: row.flavoredItemID, flavorName: row.flavorName, price: row.price, ingredients: [] };
                }
                if (row.ingredientID) {
                    flavorsMap[row.flavorName].ingredients.push({
                        ingredientID: row.ingredientID,
                        ingredientName: row.ingredientName,
                        quantityRequired: row.quantityRequired
                    });
                }
            }
            typeData = { flavors: Object.values(flavorsMap) };
        }

        res.json({ success: true, data: { ...product, ...typeData, addOns } });
    } catch (error) {
        console.error('Error fetching product: ', error);
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
});

router.put('/:productId', async (req, res) => {
    const { productId } = req.params;
    const { productName, category, imageURL, price, ingredients, addOns, sizes, flavors } = req.body;

    try {
        await updateProductBase(productId, productName, category, imageURL);

        if (price !== undefined) {
            await updateSimpleProductPrice(productId, price);
        }

        if (ingredients) {
            await replaceProductIngredients(productId, ingredients);
        }

        if (sizes) {
            for (const size of sizes) {
                await replaceDrinkIngredients(size.drinkID, size.ingredients);
            }
        }

        if (flavors) {
            for (const flavor of flavors) {
                await replaceFlavoredItemIngredients(flavor.flavoredItemID, flavor.ingredients);
            }
        }

        if (addOns) {
            await replaceProductAddOns(productId, addOns);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to update product: ', error);
        res.status(500).json({ success: false, error: 'Failed to update product' });
    }
});

export default router;
