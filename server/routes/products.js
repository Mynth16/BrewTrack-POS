import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProductMenu, getProductVariants, getAvailableAddOns, getProductCategories } from '../db.js';

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

export default router;
