/**
 * Data Sanitizer
 * Removes sensitive fields before sending data to AI
 */

/**
 * Sanitize data to remove sensitive fields before sending to AI
 */
export const sanitizeData = (data) => {
  if (!data) return data;

  // Sensitive fields that should never be exposed
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'resetPasswordToken',
    'resetPasswordExpire',
    'twoFactorSecret',
    'apiKey',
    'secret',
    'privateKey',
    'accessToken',
    'refreshToken'
  ];

  // Recursively remove sensitive fields
  const sanitize = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = { ...obj };

      for (const field of sensitiveFields) {
        if (sanitized[field] !== undefined) {
          delete sanitized[field];
        }
      }

      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (sanitized[key] && typeof sanitized[key] === 'object') {
          sanitized[key] = sanitize(sanitized[key]);
        }
      }

      return sanitized;
    }

    return obj;
  };

  return sanitize(data);
};
