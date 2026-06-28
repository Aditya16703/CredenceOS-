const { IdempotencyKey } = require('../models');

module.exports = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  
  if (!idempotencyKey) {
    return next();
  }

  const userId = req.user ? req.user.id : 0;
  const endpoint = req.originalUrl || req.url;

  try {
    const existing = await IdempotencyKey.findOne({
      where: { key: idempotencyKey }
    });

    if (existing) {
      if (existing.status === 'COMPLETED' && existing.responseBody) {
        return res.status(existing.responseStatus || 200).json({
          ...existing.responseBody,
          _idempotentReplay: true
        });
      }

      if (existing.status === 'PROCESSING') {
        return res.status(409).json({
          success: false,
          message: 'An identical request is currently being processed. Please retry shortly.'
        });
      }
    }

    // Register active key
    const record = await IdempotencyKey.create({
      key: idempotencyKey,
      userId,
      endpoint,
      status: 'PROCESSING'
    });

    // Intercept res.send/res.json to persist result
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Async update key status
      record.update({
        status: res.statusCode < 400 ? 'COMPLETED' : 'FAILED',
        responseStatus: res.statusCode,
        responseBody: body
      }).catch(err => console.error('Failed to update idempotency key:', err.message));

      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error.message);
    next();
  }
};
