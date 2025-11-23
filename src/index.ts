import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/', authRoutes);

// error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
