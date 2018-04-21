/** ./pages/admin/book-detail.js
 *
 * Displays a list of chapters with hyperlinked titles.
 *
 * The book-detail.js page has two main purposes.
 * The first is to show book data (such as name, githubRepo, chapters, and more)
 * to the Admin user.
 * The second is to sync content.
 * This page will have a Sync button that our Admin clicks to get content from Github.
 *
 *
 */

import React from 'react';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import Error from 'next/error';
import Link from 'next/link';
import Button from 'material-ui/Button';

import { getBookDetail, syncBookContent } from '../../lib/api/admin';
import withLayout from '../../lib/withLayout';
import withAuth from '../../lib/withAuth';
import notify from '../../lib/notifier';

const handleSyncContent = bookId => async () => {
  try {
    // We call the API method syncBookContent() (discussed in Admin Dashboard section)
    // inside the handleSyncContent() function:
    await syncBookContent({ bookId });
    notify('Synced');
  } catch (err) {
    notify(err);
  }
};

const MyBook = ({ book, error }) => {
  if (error) {
    notify(error);
    return <Error statusCode={500} />;
  }

  if (!book) {
    return null;
  }

  const { chapters = [] } = book;

  return (
    <div style={{ padding: '10px 45px' }}>
      <h2>{book.name}</h2>
      <a target="_blank" rel="noopener noreferrer">
        Repo on Github
      </a>
      <p />
      {/* To sync content on the button click,
      add the function handleSyncContent() to the onClick handler: */}
      <Button variant="raised" onClick={handleSyncContent(book._id)}>
        Sync with Github
      </Button>{' '}
      <Link as={`/admin/edit-book/${book.slug}`} href={`/admin/edit-book?slug=${book.slug}`}>
        <Button variant="raised">Edit book</Button>
      </Link>
      <ul>
        {chapters.map(ch => (
          <li key={ch._id}>
            <Link
              as={`/books/${book.slug}/${ch.slug}`}
              href={`/public/read-chapter?bookSlug=${book.slug}&chapterSlug=${ch.slug}`}
            >
              <a>{ch.title}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

MyBook.propTypes = {
  book: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  error: PropTypes.string,
};

MyBook.defaultProps = {
  book: null,
  error: null,
};

class MyBookWithData extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired,
  };

  // Similar to our edit-book.js page, we need to display book data.
  // We do it the same way as we did on edit-book.js:
  static getInitialProps({ query }) {
    return { slug: query.slug };
  }

  state = {
    loading: true,
    error: null,
    book: null,
  };

  async componentDidMount() {
    NProgress.start();
    try {
      // API method getBookDetail() inside lifecycle hook componentDidMount:
      const book = await getBookDetail({ slug: this.props.slug });
      this.setState({ book, loading: false }); // eslint-disable-line
      NProgress.done();
    } catch (err) {
      this.setState({ loading: false, error: err.message || err.toString() }); // eslint-disable-line
      NProgress.done();
    }
  }

  render() {
    // Passing props to component:
    return <MyBook {...this.props} {...this.state} />;
  }
}

export default withAuth(withLayout(MyBookWithData));
