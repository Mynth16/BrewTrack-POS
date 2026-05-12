import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import ingredientsRoutes from './routes/ingredients.js';
import productsRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import addOnRoutes from './routes/addOn.js';
import usersRoutes from './routes/users.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/addons', addOnRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Server] BrewTrack POS API running on http://localhost:${PORT}`);
});
