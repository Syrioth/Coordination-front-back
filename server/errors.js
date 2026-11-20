const { logger } = require('./logger');

class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

function mapDatabaseError(err) {
  const msg = String(err && err.message ? err.message : err);
  if (msg.includes('UNIQUE constraint failed')) {
    return new AppError(
      'Une ressource avec cet identifiant ou ce pseudo existe déjà.',
      409,
      'CONFLICT',
      { dbMessage: msg }
    );
  }
  if (msg.includes('CHECK constraint failed') || msg.includes('NOT NULL constraint failed')) {
    return new AppError(
      'Les données envoyées ne respectent pas les contraintes de la base de données.',
      422,
      'VALIDATION_ERROR',
      { dbMessage: msg }
    );
  }
  const dbError = new AppError(
    'Erreur lors de l’accès à la base de données.',
    500,
    'DB_ERROR',
    { dbMessage: msg }
  );
  dbError.isOperational = false;
  return dbError;
}

function notFoundHandler(req, res, next) {
  next(
    new AppError(
      `Route introuvable : ${req.method} ${req.originalUrl}`,
      404,
      'NOT_FOUND',
      { method: req.method, path: req.originalUrl }
    )
  );
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const requestId = req.requestId || `req_${Date.now()}`;

  let normalized = err;
  if (!(err instanceof AppError)) {
    if (err && (err.code === 'ERR_SQLITE_ERROR' || String(err.message || '').includes('SQLITE'))) {
      normalized = mapDatabaseError(err);
    } else if (err && err.type === 'entity.parse.failed') {
      normalized = new AppError('Corps JSON invalide.', 400, 'INVALID_JSON', {
        reason: err.message
      });
    } else {
      normalized = new AppError(
        err && err.message ? err.message : 'Erreur interne inattendue',
        err && err.status ? err.status : 500,
        'INTERNAL_SERVER_ERROR'
      );
      normalized.isOperational = false;
      if (err && err.stack) normalized.stack = err.stack;
    }
  }

  logger.error(normalized.message, {
    requestId,
    code: normalized.code,
    status: normalized.status,
    method: req.method,
    path: req.originalUrl,
    details: normalized.details,
    stack: normalized.stack
  });

  const hideDetails = isProd && normalized.status >= 500;
  const responseBody = {
    success: false,
    error: {
      code: hideDetails ? 'INTERNAL_SERVER_ERROR' : normalized.code,
      message: hideDetails
        ? 'Une erreur interne est survenue. Veuillez réessayer plus tard.'
        : normalized.message,
      status: normalized.status,
      requestId,
      timestamp: new Date().toISOString()
    }
  };

  if (!isProd) {
    if (normalized.details) responseBody.error.details = normalized.details;
    if (normalized.stack) responseBody.error.stack = normalized.stack;
  } else if (normalized.details && normalized.status < 500) {
    const safeDetails = { ...normalized.details };
    delete safeDetails.dbMessage;
    if (Object.keys(safeDetails).length > 0) {
      responseBody.error.details = safeDetails;
    }
  }

  return res.status(normalized.status).json(responseBody);
}

module.exports = { AppError, mapDatabaseError, notFoundHandler, errorHandler };
