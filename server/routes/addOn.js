import express from 'express';
import { getAllAddOns } from '../db.js';

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

export default router;