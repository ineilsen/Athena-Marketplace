const isDebug = !!process.env.DEBUG;
function info(...args) {
  console.log('[INFO]', ...args);
}
function debug(...args) {
  if (isDebug) console.debug('[DEBUG]', ...args);
}
function error(...args) {
  console.error('[ERROR]', ...args);
}
export default { info, debug, error, isDebug };
