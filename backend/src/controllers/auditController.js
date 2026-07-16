const { AuditLog, User } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entityType, actorId, limit = 50, offset = 0 } = req.query;

  const where = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (actorId) where.actorId = actorId;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10)
  });

  res.json({
    success: true,
    total: count,
    data: rows
  });
});
