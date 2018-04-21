/**
 * ./lib/api/sendRequest.js
 */

import 'isomorphic-fetch';
import getRootUrl from './getRootUrl';

export default async function sendRequest(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}, {
    'Content-type': 'application/json; charset=UTF-8',
  });

  // Our code awaits for fetch() to return a response with data.
  // fetch(path, options) is a global JavaScript method
  // that takes a route and the parameters of a request,
  // then returns a response with data available from the API endpoint.
  // You can read more about the properties of fetch() here: https://github.github.io/fetch/
  // The fetch() method is not available on older browsers.
  // That why we import isomorphic-fetch, which is an implementation of fetch() for Node.
  const response = await fetch(
    `${getRootUrl()}${path}`,
    Object.assign({ method: 'POST', credentials: 'include' }, opts, { headers }),
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
