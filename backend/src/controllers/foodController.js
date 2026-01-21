import { supabase } from '../config/supabase.js';
import { getMoodBasedRecommendations, diversifyRecommendations } from '../algorithms/recommendation.js';

/**
 * Get all food items with filters
 */
export const getFoodItems = async (req, res, next) => {
  try {
    const { category, available, search, is_special, is_seasonal, is_fasting, mood } = req.query;

    let query = supabase.from('food_items').select(`
      *,
      food_reviews (
        rating
      )
    `);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (available !== undefined) {
      query = query.eq('available', available === 'true');
    }

    if (is_special !== undefined) {
      query = query.eq('is_special', is_special === 'true');
    }

    if (is_seasonal !== undefined) {
      query = query.eq('is_seasonal', is_seasonal === 'true');
    }

    if (is_fasting !== undefined) {
      query = query.eq('is_fasting', is_fasting === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data: items, error } = await query.order('name');

    if (error) throw error;

    // Calculate average rating for each item
    const itemsWithRating = items.map(item => {
      const reviews = item.food_reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        ...item,
        rating: avgRating,
        review_count: reviews.length
      };
    });

    // If mood is provided, apply recommendation algorithm
    let result = itemsWithRating;
    if (mood && req.user) {
      // Get user preferences (simplified for now)
      const userPreferences = {
        frequentlyOrdered: [] // Can be fetched from order history
      };

      result = getMoodBasedRecommendations(itemsWithRating, mood, userPreferences, 20);
      result = diversifyRecommendations(result);
    }

    res.json({
      items: result,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single food item by ID
 */
export const getFoodItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: item, error } = await supabase
      .from('food_items')
      .select(`
        *,
        food_reviews (
          id,
          rating,
          comment,
          created_at,
          user_profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Food item not found' });
      }
      throw error;
    }

    // Calculate average rating
    const reviews = item.food_reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      item: {
        ...item,
        rating: avgRating,
        review_count: reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new food item (Admin only)
 */
export const createFoodItem = async (req, res, next) => {
  try {
    const foodData = req.body;

    const { data: item, error } = await supabase
      .from('food_items')
      .insert(foodData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Food item created successfully',
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update food item (Admin only)
 */
export const updateFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: item, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Food item not found' });
      }
      throw error;
    }

    res.json({
      message: 'Food item updated successfully',
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete food item (Admin only)
 */
export const deleteFoodItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get food categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('category')
      .order('category');

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];

    res.json({
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get best-selling items
 */
export const getBestSelling = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        order_items (
          quantity
        ),
        food_reviews (
          rating
        )
      `)
      .limit(parseInt(limit));

    if (error) throw error;

    // Calculate total orders for each item
    const itemsWithStats = data.map(item => {
      const totalOrders = item.order_items.reduce((sum, oi) => sum + oi.quantity, 0);
      const reviews = item.food_reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        ...item,
        total_orders: totalOrders,
        rating: avgRating,
        review_count: reviews.length
      };
    });

    // Sort by total orders
    const bestSelling = itemsWithStats
      .sort((a, b) => b.total_orders - a.total_orders)
      .slice(0, parseInt(limit));

    res.json({
      items: bestSelling
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get surplus food items (low stock, near expiry, etc.)
 */
export const getSurplusFood = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .or('is_surplus.eq.true,stock_quantity.lt.10')
      .eq('available', true);

    if (error) throw error;

    res.json({
      items: data
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getCategories,
  getBestSelling,
  getSurplusFood
};
