const isDev = process.env.NODE_ENV !== 'production';

function formatMsg(level, msg, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  info(msg, meta) {
    if (isDev) console.log(formatMsg('info', msg, meta));
  },
  warn(msg, meta) {
    console.warn(formatMsg('warn', msg, meta));
  },
  error(msg, meta) {
    console.error(formatMsg('error', msg, meta));
  },
};

module.exports = logger;
