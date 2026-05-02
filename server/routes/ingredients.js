import express from 'express';
import { getIngredientList } from '../db.js';

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

export default router;