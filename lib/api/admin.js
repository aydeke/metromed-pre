/**
 * ./lib/api/admin.js
 */

import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/admin';

export const syncTOS = () => sendRequest(`${BASE_PATH}/sync-tos`);

export const getBookList = () =>
  sendRequest(`${BASE_PATH}/books`, {
    method: 'GET',
  });

/**
 * The API method addBook takes name, price, and githubRepo specified by our Admin user
 * and sends a POST request to the server at /api/v1/admin/books/add.
 */
export const addBook = ({ name, price, githubRepo }) =>
  // We defined the sendRequest() function at lib/api/sendRequest.js.
  // By default, this method is POST unless we specify method: 'GET'.
  // POST is the default method, so we don't need to specify it inside sendRequest().
  // Note that ${BASE_PATH} for lib/api/admin.js is /api/v1/admin.
  sendRequest(`${BASE_PATH}/books/add`, {
    // We do add the three book parameters (necessary for new book creation)
    // to our request's body:
    body: JSON.stringify({ name, price, githubRepo }),
  });

/**
 * The API method editBook is very similar to addBook -
 * it's a POST method that takes name, price, and githubRepo.
 * In addition to these parameters, it takes a book's id to pass it to findById
 * inside our static method static async edit() at server/models/Book.js.
 */
export const editBook = ({
  id, name, price, githubRepo,
}) =>
  sendRequest(`${BASE_PATH}/books/edit`, {
    body: JSON.stringify({
      id,
      name,
      price,
      githubRepo,
    }),
  });

/**
 * Unlike our addBook and editBook methods,
 * the getBookDetail method sends a GET request.
 * The server receives a slug parameter
 * as part of the query string /api/v1/admin/books/detail/${slug}.
 */
export const getBookDetail = ({ slug }) =>
  sendRequest(`${BASE_PATH}/books/detail/${slug}`, {
    method: 'GET',
  });

/**
 * The API method syncBookContent sends a POST request to the server.
 * This method adds bookId to the request's body.
 */
export const syncBookContent = ({ bookId }) =>
  sendRequest(`${BASE_PATH}/books/sync-content`, {
    body: JSON.stringify({ bookId }),
  });

/**
 * Finally, the API method getGithubRepos sends a GET request to the server.
 * This method does not pass any of a book's parameters to the server.
 * The HOC withAuth.js that wraps all Admin pages passes a user to the server,
 * where our Express route router.get('/github/repos')
 * uses req.user._id and user.githubAccessToken
 * to find the user and get a list of his/her repos.
 */
export const getGithubRepos = () =>
  sendRequest(`${BASE_PATH}/github/repos`, {
    method: 'GET',
  });
