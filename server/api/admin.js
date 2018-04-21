/**
 * ./server/api/admin.js
 */

import express from 'express';

import Book from '../models/Book';
import { getContent, getRepos } from '../github';
import User from '../models/User';
import logger from '../logs';

const router = express.Router();

// router-level middleware that verifies our user is Admin.
router.use((req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  // If so, then the user has access to all API endpoints
  // with the base route /api/v1/admin/*.
  next();
});

/**
 * Express route '/books' calls and waits for the static method Book.list().
 */
// If the client (web browser)
// sends a GET request to /api/v1/admin/books,
router.get('/books', async (req, res) => {
  try {
    // the our router calls the static method Book.list()
    // that returns the list of books.
    const books = await Book.list();
    // If successful, the router returns JSON data: res.json(books).
    res.json(books);
  } catch (err) {
    res.json({ error: err.message || err.toString() });
  }
});

/**
 * The Express route router.post('/books/add')
 * gets the book's data (name, price, githubRepo) from the request's body.
 */
router.post('/books/add', async (req, res) => {
  try {
    // This route calls the static method add() in our Book model to create a new book:
    const book = await Book.add(Object.assign({ userId: req.user.id }, req.body));
    // The code inside this route does not have to return a book object to the client (browser).
    // We use this route to create a new book with data stored in req.body.
    // However, after a new book is created, we want to sync the book content
    // with the syncContent() function that requires a book._id from a book object.
    // Thus, let's return book object to the client (browser) with res.json(book):
    res.json(book);
  } catch (err) {
    logger.error(err);
    res.json({ error: err.message || err.toString() });
  }
});

/**
 * The Express route router.post('/books/edit') is very similar to router.post('/books/add').
 * Instead of returning res.json(), it returns res.json({ done: 1 }).
 * The reason we don't need to return a book object to the client
 * is that the book object will already be on the EditBook page.
 * The Express route router.get('/books/detail/:slug')
 * sends a book object to the EditBook page,
 * so router.post('/books/edit') does not have to.
 */
router.post('/books/edit', async (req, res) => {
  try {
    await Book.edit(req.body);
    // For POST requests that pass data to our server (to create/update data),
    // the response typically does not have to return any data to the client.
    // For example, in this Express route,
    // we don't have to return a book object to the client (browser).
    // However, the server must return a response in a req-res cycle.
    // Thus, we decided to return done: 1 (instead of returning any actual data).
    // You can return whatever you want, for example save: 1.
    res.json({ done: 1 });
  } catch (err) {
    res.json({ error: err.message || err.toString() });
  }
});

/**
 * The Express route router.get('/books/detail/:slug')
 * gets slug and is called by the getBookDetail() API method
 * located in the pages/admin/book-detail.js page.
 * Book.getBySlug(), inside this Express route, finds a book using slug.
 */
router.get('/books/detail/:slug', async (req, res) => {
  try {
    // Express uses req.params to extract a parameter from the route with req.params.slug:
    const book = await Book.getBySlug({ slug: req.params.slug });
    res.json(book);
  } catch (err) {
    res.json({ error: err.message || err.toString() });
  }
});

/**
 * Inside the router.post('/books/sync-content') route, we want to do two things:
 * 1) check if our Admin user has connected Github to our app
 * 2) call the syncContent() static method from our Book model
 */
router.post('/books/sync-content', async (req, res) => {
  // syncContent() needs bookId.
  // In our request that we send to the server,
  // we pass bookId in the request's body as req.body.bookId.
  // We use ES6 destructuring syntax:
  const { bookId } = req.body;

  // To check if the user has connected Github,
  // we send the user's _id to our server as req.user._id.
  // Then we use req.user._id to find this user
  // with Mongoose's Model.findById(id, [projection]) method.
  // In [projection], we specify values we'd like to return:
  // isGithubConnected and githubAccessToken:
  const user = await User.findById(req.user._id, 'isGithubConnected githubAccessToken');

  // We check if isGithubConnected is true _or_ if githubAccessToken exists (not null).
  if (!user.isGithubConnected || !user.githubAccessToken) {
    // We throw an error if at least one of them is false or does not exist:
    res.json({ error: 'Github not connected' });
    return;
  }

  // Finally, by using the try/catch construct (as you did many times already),
  try {
    // our Express route calls the Book model's syncContent() static method.
    // This method takes two parameters (check up server/models/Book.js):
    await Book.syncContent({ id: bookId, githubAccessToken: user.githubAccessToken });
    res.json({ done: 1 });
  } catch (err) {
    logger.error(err);
    res.json({ error: err.message || err.toString() });
  }
});

/**
 * Inside the router.get('/github/repos') Express route, our goals are:
 * 1) check if our Admin user has connected Github to our web app
 * 2) call the getRepos API method (defined in server/github.js),
 *    which returns a list of repos for a given user
 */
router.get('/github/repos', async (req, res) => {
  const user = await User.findById(req.user._id, 'isGithubConnected githubAccessToken');

  // We check if isGithubConnected is true _or_ if githubAccessToken exists (not null).
  if (!user.isGithubConnected || !user.githubAccessToken) {
    // We throw an error if at least one of them is false or does not exist:
    res.json({ error: 'Github is not connected' });
    return;
  }

  // Calling getRepos() with try/catch is very similar
  // to how we called Book.syncContent() with that same construct.
  // The only difference is that we wait (await)
  // for a response with data (response.data) from the getRepos() API method.
  try {
    // Keep in mind that unlike Book.syncContent(),
    // getRepos() requires only one parameter, accessToken: user.githubAccessToken:
    const response = await getRepos({ accessToken: user.githubAccessToken });
    // We send a response with data (list of repos) to the client:
    res.json({ repos: response.data });
  } catch (err) {
    logger.error(err);
    res.json({ error: err.message || err.toString() });
  }
});

export default router;
