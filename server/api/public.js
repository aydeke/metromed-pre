/**
 * ./server/api/public.js
 */

import express from 'express';

import Chapter from '../models/Chapter';

const router = express.Router();

// Express route with the GET method and /get-chapter-detail API endpoint:
router.get('/get-chapter-detail', async (req, res) => {
  try {
    // On the browser, a user will access /books/:bookSlug/:chapterSlug,
    // so we need to extract bookSlug and chapterSlug values from this query string.
    // Express achieves this with req.query. For example, if query string is:
    // /get-chapter-detail?bookSlug=${bookSlug}&chapterSlug=${chapterSlug}
    // then we can access parameters inside query string with:
    // const bookSlug = req.query.bookSlug;
    // const chapterSlug = req.query.chapterSlug;
    // After using ES6 object destructuring, we can simplify it and get:
    const { bookSlug, chapterSlug } = req.query;
    // Inside the Express route, we call Chapter.getBySlug() static method
    // (we wrote it earlier in this chapter).
    // Use our favorite async/await with try/catch construct.
    // Await for the static method Chapter.getBySlug()
    // to find and return the proper chapter object:
    const chapter = await Chapter.getBySlug({
      bookSlug,
      chapterSlug,
    });
    // If we successfully retrieve the right chapter,
    // we will send a response with JSON data:
    res.json(chapter);
  } catch (err) {
    // Otherwise, we will catch an error
    // and send a response with an error message:
    res.json({ error: err.message || err.toString() });
  }
});

export default router;
