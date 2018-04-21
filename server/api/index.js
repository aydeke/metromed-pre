/**
 * ./server/api/index.js
 */

import publicApi from './public';
import customerApi from './customer';
import adminApi from './admin';

console.log('Hello from ./server/api/index.js');

export default function api(server) {
  server.use('/api/v1/public', publicApi);
  server.use('/api/v1/customer', customerApi);
  server.use('/api/v1/admin', adminApi);
}
