import express from 'express';
import { getIngredientList, updateIngredient, addIngredient } from '../db.js';

const router = express.Router();

export async function listIngredients(req, res) {
  try {
    const ingredients = await getIngredientList();
    res.json({ ingredients });
  } catch (error) {
    console.error('Failed to load ingredients:', error);
    res.status(500).json({ error: 'Failed to load ingredients' });
  }
}

router.get('/', listIngredients);

router.put('/:ingredientId', async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { ingredientName, stockQuantity, unit, minStockLevel, expiryDate } = req.body;

    const updated = await updateIngredient(
      ingredientId,
      ingredientName,
      stockQuantity,
      unit,
      minStockLevel !== null ? minStockLevel : null,
      expiryDate || null
    );

    res.json({ success: true, message: 'Ingredient updated successfully'});
  } catch (error) {
    console.error('Failed to update ingredient: ', error);
    res.status(500).json({ error: 'Failed to update ignredient'});
  }
});

router.post('/', async (req, res) => {
  try {
    const { ingredientName,
            stockQuantity,
            unit,
            minStockLevel,
            expiryDate,
    } = req.body;
    const newIngredient = await addIngredient(ingredientName, stockQuantity, unit, minStockLevel, expiryDate);
    res.status(201).json({success: true, ingredient: newIngredient});
  } catch (error) {
    console.error('Failed to add ingredient', error);
    res.status(500).json({error: 'Failed to add ingredient'});
  }
});

export default router;