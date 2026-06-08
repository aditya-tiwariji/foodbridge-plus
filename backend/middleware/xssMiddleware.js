// Custom XSS Sanitizer Middleware to recursively cleanse req.body, req.query, and req.params

const cleanText = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim();
};

const sanitizeObj = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObj(item));
  }
  if (obj !== null && typeof obj === 'object') {
    // If it's a Buffer or Mongoose schema object, don't walk it
    if (obj.constructor && obj.constructor.name === 'Buffer') {
      return obj;
    }
    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cleaned[key] = sanitizeObj(obj[key]);
      }
    }
    return cleaned;
  }
  return cleanText(obj);
};

export const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeObj(req.body);
  if (req.query) req.query = sanitizeObj(req.query);
  if (req.params) req.params = sanitizeObj(req.params);
  next();
};
