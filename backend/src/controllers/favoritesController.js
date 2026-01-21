import { supabase } from '../config/supabase.js';

/**
 * Add item to favorites
 */
export const addToFavorites = async (req, res, next) => {
  try {
    const { food_item_id } = req.body;
    const userId = req.user.id;

    // Check if already in favorites
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('food_item_id', food_item_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      return res.status(400).json({
        error: 'Item already in favorites'
      });
    }

    // Add to favorites
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        food_item_id
      })
      .select(`
        *,
        food_items (*)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Added to favorites successfully',
      favorite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from favorites
 */
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { food_item_id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('food_item_id', food_item_id);

    if (error) throw error;

    res.json({
      message: 'Removed from favorites successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user favorites
 */
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        *,
        food_items (
          *,
          food_reviews (
            rating
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average rating for each item
    const favoritesWithRating = favorites.map(fav => {
      const reviews = fav.food_items.food_reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        ...fav,
        food_items: {
          ...fav.food_items,
          rating: avgRating,
          review_count: reviews.length
        }
      };
    });

    res.json({
      favorites: favoritesWithRating,
      count: favoritesWithRating.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if item is in favorites
 */
export const checkFavorite = async (req, res, next) => {
  try {
    const { food_item_id } = req.params;
    const userId = req.user.id;

    const { data: favorite, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('food_item_id', food_item_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      is_favorite: !!favorite
    });
  } catch (error) {
    next(error);
  }
};

export default {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite
};
