const { ValidationError: SequelizeValidationError, DatabaseError, ConnectionError, TimeoutError } = require('sequelize');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class CustomValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Sequelize validation error
  if (err instanceof SequelizeValidationError) {
    const message = 'Validation Error';
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    error = new CustomValidationError(message, errors);
  }

  // Sequelize database error
  if (err instanceof DatabaseError) {
    const message = 'Database Error';
    error = new AppError(message, 500, 'DATABASE_ERROR');
  }

  // Sequelize connection error
  if (err instanceof ConnectionError) {
    const message = 'Database Connection Error';
    error = new AppError(message, 503, 'CONNECTION_ERROR');
  }

  // Sequelize timeout error
  if (err instanceof TimeoutError) {
    const message = 'Database Timeout Error';
    error = new AppError(message, 504, 'TIMEOUT_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new UnauthorizedError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new UnauthorizedError(message);
  }

  // Mongoose cast error (if using MongoDB)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError();
  }

  // Duplicate key error
  if (err.code === 11000 || err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, 'DUPLICATE_ERROR');
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error = new AppError('Internal Server Error', 500, 'INTERNAL_ERROR');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.name 
    })
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

module.exports = {
  AppError,
  NotFoundError,
  CustomValidationError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  asyncHandler,
  notFound
};