// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key constraint violation
        statusCode = 400;
        message = 'Invalid reference';
        break;
      case 'PGRST116': // Not found
        statusCode = 404;
        message = 'Resource not found';
        break;
      default:
        message = err.message || 'Database error';
    }
  }

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.originalUrl} not found`
  });
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
