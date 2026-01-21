import express from 'express';
import {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getCategories,
  getBestSelling,
  getSurplusFood
} from '../controllers/foodController.js';
import { authenticateUser, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// Public/Optional auth routes
router.get('/', optionalAuth, getFoodItems);
router.get('/categories', getCategories);
router.get('/best-selling', getBestSelling);
router.get('/surplus', getSurplusFood);
router.get('/:id', getFoodItemById);

// Admin only routes
router.post('/', authenticateUser, requireAdmin, validate(schemas.foodItem), createFoodItem);
router.put('/:id', authenticateUser, requireAdmin, validate(schemas.foodItem), updateFoodItem);
router.delete('/:id', authenticateUser, requireAdmin, deleteFoodItem);

export default router;
