import express from 'express';
import { getAllAddOns } from '../db.js';
import { addAddOn } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const addOns = await getAllAddOns();
        res.json({ success: true, addOns });
    } catch (error) {
        console.error('Failed to get add-ons: ', error);
        res.status(500).json({ success: false, error: 'Failed to get add-ons' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { ingredientID, addOnName, addOnPrice } = req.body;
        
        if (!ingredientID || !addOnName || addOnPrice === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const newAddOn = await addAddOn(ingredientID, addOnName, addOnPrice);
        res.status(201).json({ success: true, addOn: newAddOn });
    } catch (error) {
        console.error('Failed to add add-on: ', error);
        res.status(500).json({ success: false, error: 'Failed to add add-on' });
    }
});

export default router;