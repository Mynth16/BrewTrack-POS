import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getIngredientList,
  addRestockTemplate,
  getRestockTemplates,
  getRestockTemplateById,
  updateRestockTemplate,
  deleteRestockTemplate,
  applyRestock
} from '../db.js';

const router = express.Router();

function requireManager(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'Manager') return res.status(403).json({ error: 'Manager only' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/ingredients', async (req, res) => {
  try {
    const ingredients = await getIngredientList();
    res.json({ success: true, ingredients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load ingredients' });
  }
});

router.get('/templates', requireManager, async (req, res) => {
  try {
    const templates = await getRestockTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load templates' });
  }
});

router.get('/templates/:id', requireManager, async (req, res) => {
  try {
    const template = await getRestockTemplateById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load template' });
  }
});

router.post('/templates', requireManager, async (req, res) => {
  try {
    const { templateName, description = null, items = [] } = req.body;
    if (!templateName) return res.status(400).json({ success: false, error: 'templateName required' });
    const t = await addRestockTemplate(templateName, description, items);
    res.status(201).json({ success: true, template: t });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

router.put('/templates/:id', requireManager, async (req, res) => {
  try {
    const { templateName, description = null, items = [] } = req.body;
    await updateRestockTemplate(req.params.id, templateName, description, items);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

router.delete('/templates/:id', requireManager, async (req, res) => {
  try {
    await deleteRestockTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

router.post('/apply', requireManager, async (req, res) => {
  try {
    const { items = [] } = req.body; // [{ ingredientID, quantityAdded }]
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, error: 'No items provided' });
    await applyRestock(items);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to apply restock' });
  }
});

export default router;