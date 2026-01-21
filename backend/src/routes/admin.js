import express from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCategorySales,
  getPeakHours
} from '../controllers/adminController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateUser, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/revenue-analytics', getRevenueAnalytics);
router.get('/order-analytics', getOrderAnalytics);
router.get('/category-sales', getCategorySales);
router.get('/peak-hours', getPeakHours);

export default router;
