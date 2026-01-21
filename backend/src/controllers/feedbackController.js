import { supabase } from '../config/supabase.js';

/**
 * Submit feedback/review
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { order_id, rating, comment, is_anonymous = false, food_item_ratings } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user and is completed
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    if (order.status !== 'completed') {
      return res.status(400).json({
        error: 'Can only review completed orders'
      });
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingFeedback) {
      return res.status(400).json({
        error: 'Feedback already submitted for this order'
      });
    }

    // Create overall feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        order_id,
        user_id: is_anonymous ? null : userId,
        rating,
        comment,
        is_anonymous
      })
      .select()
      .single();

    if (feedbackError) throw feedbackError;

    // Create individual food item reviews if provided
    if (food_item_ratings && Array.isArray(food_item_ratings)) {
      const reviewsData = food_item_ratings.map(item => ({
        food_item_id: item.food_item_id,
        user_id: is_anonymous ? null : userId,
        order_id,
        rating: item.rating,
        comment: item.comment || null,
        is_anonymous
      }));

      await supabase
        .from('food_reviews')
        .insert(reviewsData);
    } else {
      // Create reviews for all items in the order with the overall rating
      const reviewsData = order.order_items.map(item => ({
        food_item_id: item.food_item_id,
        user_id: is_anonymous ? null : userId,
        order_id,
        rating,
        comment: null,
        is_anonymous
      }));

      await supabase
        .from('food_reviews')
        .insert(reviewsData);
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback for an order
 */
export const getOrderFeedback = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.userProfile.role === 'admin';

    // Verify user can access this feedback
    if (!isAdmin) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', order_id)
        .single();

      if (error || order.user_id !== userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('order_id', order_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      throw error;
    }

    res.json({
      feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedback (Admin only)
 */
export const getAllFeedback = async (req, res, next) => {
  try {
    const { rating, is_anonymous, start_date, end_date } = req.query;

    let query = supabase
      .from('feedback')
      .select(`
        *,
        orders (
          order_token,
          created_at
        ),
        user_profiles (
          full_name,
          email
        )
      `);

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (is_anonymous !== undefined) {
      query = query.eq('is_anonymous', is_anonymous === 'true');
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: feedbackList, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: feedbackList.length,
      average_rating: feedbackList.length > 0
        ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length
        : 0,
      ratings_distribution: {
        5: feedbackList.filter(f => f.rating === 5).length,
        4: feedbackList.filter(f => f.rating === 4).length,
        3: feedbackList.filter(f => f.rating === 3).length,
        2: feedbackList.filter(f => f.rating === 2).length,
        1: feedbackList.filter(f => f.rating === 1).length
      },
      anonymous_count: feedbackList.filter(f => f.is_anonymous).length
    };

    res.json({
      feedback: feedbackList,
      stats,
      count: feedbackList.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get food item reviews
 */
export const getFoodItemReviews = async (req, res, next) => {
  try {
    const { food_item_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const { data: reviews, error } = await supabase
      .from('food_reviews')
      .select(`
        *,
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('food_item_id', food_item_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Get total count
    const { count, error: countError } = await supabase
      .from('food_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('food_item_id', food_item_id);

    if (countError) throw countError;

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      average_rating: avgRating,
      total_count: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  submitFeedback,
  getOrderFeedback,
  getAllFeedback,
  getFoodItemReviews,
  deleteFeedback
};
