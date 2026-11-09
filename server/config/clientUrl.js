// Allowed website addresses. CLIENT_URL can hold several, separated by commas.
const raw = process.env.CLIENT_URL || 'http://localhost:5173';

const CLIENT_URLS = raw
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

module.exports = { CLIENT_URLS, CLIENT_URL: CLIENT_URLS[0] };