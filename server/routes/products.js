import express from 'express';
import pool from '../db.js';

const router = express.Router();

export async function listProduct(req, res) {
    try {
        const [rows] = await pool.query('CALL sp_GetProduct()');
        res.json({ products: rows });
    } catch (error) {
        console.error('Failed to load produccts:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
}

router.get('/', listProducts);

export default router;