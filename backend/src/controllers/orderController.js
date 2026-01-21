import { supabase } from '../config/supabase.js';
import { estimateOrderPreparationTime, suggestOptimalPickupTime } from '../algorithms/preparationTime.js';
import { canCancelOrder, sortOrdersByPriority } from '../algorithms/orderPriority.js';

/**
 * Create a new order
 */
export const createOrder = async (req, res, next) => {
  try {
    const { items, pickup_time, group_order_id, payment_method, special_instructions } = req.body;
    const userId = req.user.id;

    // Validate food items
    const foodItemIds = items.map(item => item.food_item_id);
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('*')
      .in('id', foodItemIds);

    if (foodError) throw foodError;

    if (foodItems.length !== foodItemIds.length) {
      return res.status(400).json({
        error: 'Some food items not found'
      });
    }

    // Check availability and stock
    for (const item of items) {
      const foodItem = foodItems.find(f => f.id === item.food_item_id);
      if (!foodItem.available) {
        return res.status(400).json({
          error: `${foodItem.name} is currently unavailable`
        });
      }
      if (foodItem.stock_quantity !== null && foodItem.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${foodItem.name}`
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const foodItem = foodItems.find(f => f.id === item.food_item_id);
      return sum + (foodItem.price * item.quantity);
    }, 0);

    // Get current queue length for preparation time estimation
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id')
      .in('status', ['pending', 'confirmed', 'preparing']);

    const queueLength = pendingOrders?.length || 0;

    // Estimate preparation time
    const orderItemsWithFood = items.map(item => ({
      ...item,
      food_items: foodItems.find(f => f.id === item.food_item_id)
    }));

    const preparationEstimate = estimateOrderPreparationTime(orderItemsWithFood, queueLength);

    // Generate order token
    const orderToken = `T${Date.now().toString().slice(-6)}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        group_order_id,
        order_token: orderToken,
        total_amount: totalAmount,
        pickup_time,
        estimated_ready_time: preparationEstimate.readyByTime,
        payment_method,
        payment_status: payment_method === 'cash' ? 'pending' : 'pending',
        status: 'pending',
        special_instructions
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsData = items.map(item => ({
      order_id: order.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
      price: foodItems.find(f => f.id === item.food_item_id).price,
      customizations: item.customizations,
      special_instructions: item.special_instructions
    }));

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)
      .select(`
        *,
        food_items (*)
      `);

    if (itemsError) throw itemsError;

    // Update stock quantities
    for (const item of items) {
      const foodItem = foodItems.find(f => f.id === item.food_item_id);
      if (foodItem.stock_quantity !== null) {
        await supabase
          .from('food_items')
          .update({ stock_quantity: foodItem.stock_quantity - item.quantity })
          .eq('id', item.food_item_id);
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        order_items: orderItems,
        preparation_estimate: preparationEstimate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          food_items (*)
        )
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      orders,
      count: orders.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.userProfile.role === 'admin';

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          food_items (*)
        ),
        user_profiles (
          full_name,
          email
        )
      `)
      .eq('id', id);

    // Non-admin users can only see their own orders
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: order, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    res.json({
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw fetchError;
    }

    // Check if order can be cancelled
    const cancellationCheck = canCancelOrder(order, 3);
    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        error: 'Cannot cancel order',
        reason: cancellationCheck.reason
      });
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Restore stock quantities
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, food_items(*)')
      .eq('order_id', id);

    for (const item of orderItems) {
      if (item.food_items.stock_quantity !== null) {
        await supabase
          .from('food_items')
          .update({
            stock_quantity: item.food_items.stock_quantity + item.quantity
          })
          .eq('id', item.food_item_id);
      }
    }

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    const updates = { status };
    if (notes) updates.notes = notes;

    if (status === 'ready') {
      updates.ready_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders (Admin only) with priority sorting
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, date, sort_by_priority } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          food_items (*)
        ),
        user_profiles (
          full_name,
          email
        )
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query.gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Add total_items to each order
    const ordersWithItems = orders.map(order => ({
      ...order,
      total_items: order.order_items.reduce((sum, item) => sum + item.quantity, 0)
    }));

    // Sort by priority if requested
    let result = ordersWithItems;
    if (sort_by_priority === 'true') {
      result = sortOrdersByPriority(ordersWithItems);
    }

    res.json({
      orders: result,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get optimal pickup time suggestions
 */
export const getPickupTimeSuggestions = async (req, res, next) => {
  try {
    // Get all pending and confirmed orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('pickup_time')
      .in('status', ['pending', 'confirmed', 'preparing']);

    if (error) throw error;

    const suggestions = suggestOptimalPickupTime(orders, new Date());

    res.json({
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder (one-click reorder)
 */
export const reorder = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    const userId = req.user.id;

    // Get original order
    const { data: originalOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          food_item_id,
          quantity,
          customizations,
          special_instructions
        )
      `)
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Original order not found' });
      }
      throw fetchError;
    }

    // Create new order with same items
    // Set pickup time to 30 minutes from now
    const pickupTime = new Date(Date.now() + 30 * 60 * 1000);

    req.body = {
      items: originalOrder.order_items,
      pickup_time: pickupTime.toISOString(),
      payment_method: originalOrder.payment_method
    };

    // Call createOrder function
    return createOrder(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getPickupTimeSuggestions,
  reorder
};
