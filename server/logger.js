const fs = require('node:fs');
const path = require('node:path');

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'secret', 'cookie', 'apikey']);
const LOG_DIR = path.join(__dirname, 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function redact(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(item => redact(item, depth + 1));
  if (typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = redact(val, depth + 1);
      }
    }
    return clean;
  }
  return value;
}

function writeLogFile(filename, line) {
  if (process.env.DISABLE_FILE_LOGS === 'true') return;
  try {
    ensureLogDir();
    fs.appendFileSync(path.join(LOG_DIR, filename), `${line}\n`, 'utf8');
  } catch {
    // Fallback silencieux si le système de fichiers est en lecture seule
  }
}

function log(level, message, meta = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    env: isProd ? 'production' : 'development',
    message,
    ...redact(meta)
  };
  const serialized = JSON.stringify(entry);

  if (process.env.NODE_ENV !== 'test') {
    if (isProd) {
      const stream = level === 'ERROR' ? console.error : console.log;
      stream(serialized);
    } else {
      const prefix = `[${entry.timestamp}] [${level}]`;
      const details = Object.keys(meta).length ? ` ${JSON.stringify(redact(meta))}` : '';
      const stream = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
      stream(`${prefix} ${message}${details}`);
    }
  }

  writeLogFile('app.log', serialized);
  if (level === 'ERROR') {
    writeLogFile('error.log', serialized);
  }
  return entry;
}

const logger = {
  info: (message, meta) => log('INFO', message, meta),
  warn: (message, meta) => log('WARN', message, meta),
  error: (message, meta) => log('ERROR', message, meta)
};

function requestLogger(req, res, next) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    log(level, 'HTTP request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs
    });
  });

  next();
}

module.exports = { logger, requestLogger, redact };
