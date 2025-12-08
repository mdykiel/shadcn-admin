import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import unitsRoutes from './routes/units.routes.js';
import journalsRoutes from './routes/journals.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import classificationsRoutes from './routes/classifications.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import trialBalanceRoutes from './routes/trial-balance.routes.js';
import fiscalPeriodsRoutes from './routes/fiscal-periods.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/fiscal-periods', fiscalPeriodsRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/classifications', classificationsRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/reports/trial-balance', trialBalanceRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

