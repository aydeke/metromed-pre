/**
 * ./lib/api/getRootUrl.js
 */

export default function getRootURL() {
  const port = process.env.PORT || 8000;
  const dev = process.env.NODE_ENV !== 'production';
  const ROOT_URL = dev ? `http://localhost:${port}` : 'https://metromed.now.sh';

  return ROOT_URL;
}
