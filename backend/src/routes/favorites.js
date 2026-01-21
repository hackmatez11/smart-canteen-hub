import express from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite
} from '../controllers/favoritesController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getFavorites);
router.post('/', authenticateUser, addToFavorites);
router.delete('/:food_item_id', authenticateUser, removeFromFavorites);
router.get('/check/:food_item_id', authenticateUser, checkFavorite);

export default router;
