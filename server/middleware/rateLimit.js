// General API rate limiter - DISABLED
export const apiLimiter = (req, res, next) => next();

// Stricter limiter for auth routes - DISABLED
export const authLimiter = (req, res, next) => next();

// Upload rate limiter - DISABLED
export const uploadLimiter = (req, res, next) => next();

export default { apiLimiter, authLimiter, uploadLimiter };

