export function errorHandler(err, _req, res, _next) {
  console.error(`[Error] ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      status
    }
  });
}
