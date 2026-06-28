const { AuditLog } = require('../models');

async function recordAudit({
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  previousState = null,
  newState = null,
  metadata = null,
  req = null
}) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    await AuditLog.create({
      actorId: actorId || (req?.user?.id) || null,
      actorRole: actorRole || (req?.user?.role) || 'SYSTEM',
      action,
      entityType,
      entityId,
      previousState,
      newState,
      metadata,
      ipAddress
    });
  } catch (err) {
    // Non-blocking: audit failure shouldn't crash active customer transaction, but log error
    console.error('Audit logging error:', err.message);
  }
}

module.exports = {
  recordAudit
};
