import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

/**
 * Create Razorpay order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { order_id, amount } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({
        error: 'Order already paid'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `order_${order_id}`,
      notes: {
        order_id,
        user_id: userId
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Store Razorpay order ID
    await supabase
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id
      })
      .eq('id', order_id);

    res.json({
      razorpay_order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    const userId = req.user.id;

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Update payment status as failed
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          razorpay_payment_id,
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', order_id);

      return res.status(400).json({
        error: 'Invalid payment signature',
        verified: false
      });
    }

    // Update order with payment details
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        payment_verified_at: new Date().toISOString(),
        status: 'confirmed'
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        order_id,
        user_id: userId,
        amount: order.total_amount,
        payment_method: 'razorpay',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'success'
      });

    res.json({
      message: 'Payment verified successfully',
      verified: true,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req, res, next) => {
  try {
    const { payment_id } = req.params;

    const payment = await razorpay.payments.fetch(payment_id);

    res.json({
      payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund (Admin only)
 */
export const processRefund = async (req, res, next) => {
  try {
    const { order_id, amount, reason } = req.body;

    // Get order and payment details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        payments (*)
      `)
      .eq('id', order_id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Order payment not completed'
      });
    }

    const payment = order.payments[0];
    if (!payment || !payment.razorpay_payment_id) {
      return res.status(400).json({
        error: 'Payment details not found'
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: Math.round(amount * 100), // Amount in paise
      notes: {
        reason,
        order_id
      }
    });

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        refund_amount: amount,
        refund_reason: reason,
        refunded_at: new Date().toISOString()
      })
      .eq('id', order_id);

    // Create refund record
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_id: refund.id
      })
      .eq('order_id', order_id);

    res.json({
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  processRefund
};
