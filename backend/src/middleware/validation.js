import Joi from 'joi';

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Order creation
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        food_item_id: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        customizations: Joi.string().allow('', null),
        special_instructions: Joi.string().allow('', null)
      })
    ).min(1).required(),
    pickup_time: Joi.date().iso().required(),
    group_order_id: Joi.string().uuid().allow(null),
    payment_method: Joi.string().valid('online', 'cash').required()
  }),

  // Food item creation/update
  foodItem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500),
    category: Joi.string().required(),
    price: Joi.number().positive().required(),
    image_url: Joi.string().uri().allow('', null),
    preparation_time: Joi.number().integer().positive().required(),
    available: Joi.boolean(),
    stock_quantity: Joi.number().integer().min(0),
    is_special: Joi.boolean(),
    is_seasonal: Joi.boolean(),
    is_fasting: Joi.boolean(),
    tags: Joi.array().items(Joi.string()),
    mood_tags: Joi.array().items(Joi.string())
  }),

  // Payment verification
  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    order_id: Joi.string().uuid().required()
  }),

  // Feedback submission
  feedback: Joi.object({
    order_id: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(500).allow('', null),
    is_anonymous: Joi.boolean()
  }),

  // Group order creation
  groupOrder: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    pickup_time: Joi.date().iso().required(),
    max_participants: Joi.number().integer().min(2).max(20)
  })
};
