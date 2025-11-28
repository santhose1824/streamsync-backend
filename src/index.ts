import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import fcmRoutes from './routes/fcmRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/', authRoutes);
app.use('/', fcmRoutes);
app.use('/', notificationRoutes);

// error handler (last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
