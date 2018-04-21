export default function routesWithSlug({ server, app }) {
  server.get('/books/:bookSlug/:chapterSlug', (req, res) => {
    // When our app user navigates to the /books/:bookSlug/:chapterSlug route,
    // we render the /public/read-chapter page on our server
    // with bookSLug and chapterSlug parameters extracted from the route:
    const { bookSlug, chapterSlug } = req.params;
    // To pass bookSLug and chapterSlug parameters to the page
    // and render this page on our server, we use app.render():
    app.render(req, res, '/public/read-chapter', { bookSlug, chapterSlug });
  });

  server.get('/admin/book-detail/:slug', (req, res) => {
    // We need to extract a book's slug from the route of the page,
    const { slug } = req.params;
    // then pass this slug to the server, and render pages/admin/book-detail.js:
    app.render(req, res, '/admin/book-detail', { slug });
  });

  server.get('/admin/edit-book/:slug', (req, res) => {
    // We need to extract a book's slug from the route of the page:
    const { slug } = req.params;
    // then pass this slug to the server, and render pages/admin/book-detail.js:
    app.render(req, res, '/admin/edit-book', { slug });
  });
}
