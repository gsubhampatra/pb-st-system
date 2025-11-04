// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(400).json({
          message: 'A record with this value already exists',
          details: err.meta
        });
      case 'P2025':
        return res.status(404).json({
          message: 'Record not found',
          details: err.meta
        });
      case 'P2003':
        return res.status(400).json({
          message: 'Cannot delete record: It is referenced by other records',
          details: err.meta
        });
      default:
        return res.status(500).json({
          message: 'Database error',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
  }

  // Custom errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
