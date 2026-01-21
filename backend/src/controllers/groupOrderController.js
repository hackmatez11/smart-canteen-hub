import { supabase } from '../config/supabase.js';

/**
 * Create a new group order
 */
export const createGroupOrder = async (req, res, next) => {
  try {
    const { name, pickup_time, max_participants = 10 } = req.body;
    const userId = req.user.id;

    // Generate join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: groupOrder, error } = await supabase
      .from('group_orders')
      .insert({
        creator_id: userId,
        name,
        join_code: joinCode,
        pickup_time,
        max_participants,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as first participant
    await supabase
      .from('group_order_participants')
      .insert({
        group_order_id: groupOrder.id,
        user_id: userId,
        role: 'creator'
      });

    res.status(201).json({
      message: 'Group order created successfully',
      group_order: groupOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a group order
 */
export const joinGroupOrder = async (req, res, next) => {
  try {
    const { join_code } = req.body;
    const userId = req.user.id;

    // Find group order by join code
    const { data: groupOrder, error: findError } = await supabase
      .from('group_orders')
      .select(`
        *,
        group_order_participants (
          user_id
        )
      `)
      .eq('join_code', join_code)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Group order not found' });
      }
      throw findError;
    }

    if (groupOrder.status !== 'open') {
      return res.status(400).json({
        error: 'Group order is no longer accepting participants'
      });
    }

    // Check if already a participant
    const isParticipant = groupOrder.group_order_participants.some(
      p => p.user_id === userId
    );

    if (isParticipant) {
      return res.status(400).json({
        error: 'You are already a participant in this group order'
      });
    }

    // Check max participants
    if (groupOrder.group_order_participants.length >= groupOrder.max_participants) {
      return res.status(400).json({
        error: 'Group order has reached maximum participants'
      });
    }

    // Add participant
    const { error: joinError } = await supabase
      .from('group_order_participants')
      .insert({
        group_order_id: groupOrder.id,
        user_id: userId,
        role: 'participant'
      });

    if (joinError) throw joinError;

    res.json({
      message: 'Joined group order successfully',
      group_order: groupOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get group order details
 */
export const getGroupOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: groupOrder, error } = await supabase
      .from('group_orders')
      .select(`
        *,
        group_order_participants (
          id,
          user_id,
          role,
          user_profiles (
            full_name,
            avatar_url
          )
        ),
        orders (
          *,
          order_items (
            *,
            food_items (*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Group order not found' });
      }
      throw error;
    }

    // Check if user is a participant
    const isParticipant = groupOrder.group_order_participants.some(
      p => p.user_id === userId
    );

    if (!isParticipant && req.userProfile.role !== 'admin') {
      return res.status(403).json({
        error: 'You are not a participant in this group order'
      });
    }

    // Calculate totals
    const totalAmount = groupOrder.orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalItems = groupOrder.orders.reduce((sum, order) => {
      return sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    res.json({
      group_order: {
        ...groupOrder,
        total_amount: totalAmount,
        total_items: totalItems,
        participant_count: groupOrder.group_order_participants.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's group orders
 */
export const getUserGroupOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get group orders where user is a participant
    const { data: participants, error } = await supabase
      .from('group_order_participants')
      .select(`
        group_orders (
          *,
          group_order_participants (
            id,
            user_id
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const groupOrders = participants
      .map(p => ({
        ...p.group_orders,
        participant_count: p.group_orders.group_order_participants.length
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      group_orders: groupOrders,
      count: groupOrders.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close group order (creator only)
 */
export const closeGroupOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the creator
    const { data: groupOrder, error: fetchError } = await supabase
      .from('group_orders')
      .select('*')
      .eq('id', id)
      .eq('creator_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Group order not found or you are not the creator' });
      }
      throw fetchError;
    }

    if (groupOrder.status !== 'open') {
      return res.status(400).json({
        error: 'Group order is already closed'
      });
    }

    // Update status
    const { data: updatedGroupOrder, error: updateError } = await supabase
      .from('group_orders')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Group order closed successfully',
      group_order: updatedGroupOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave group order
 */
export const leaveGroupOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is a participant
    const { data: participant, error: fetchError } = await supabase
      .from('group_order_participants')
      .select('*, group_orders(*)')
      .eq('group_order_id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'You are not a participant in this group order' });
      }
      throw fetchError;
    }

    // Creator cannot leave
    if (participant.role === 'creator') {
      return res.status(400).json({
        error: 'Creator cannot leave. Close the group order instead.'
      });
    }

    // Check if group order is still open
    if (participant.group_orders.status !== 'open') {
      return res.status(400).json({
        error: 'Cannot leave a closed group order'
      });
    }

    // Remove participant
    const { error: deleteError } = await supabase
      .from('group_order_participants')
      .delete()
      .eq('id', participant.id);

    if (deleteError) throw deleteError;

    res.json({
      message: 'Left group order successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrder,
  getUserGroupOrders,
  closeGroupOrder,
  leaveGroupOrder
};
