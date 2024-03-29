/**
 * ./pages/admin/index.js
 */

import { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import Button from 'material-ui/Button';

import notify from '../../lib/notifier';

import withLayout from '../../lib/withLayout';
import withAuth from '../../lib/withAuth';
import { getBookList } from '../../lib/api/admin';

const Index = ({ books }) => (
  <div style={{ padding: '10px 45px' }}>
    <div>
      <h2>Books</h2>
      <Link href="/admin/add-book">
        <Button variant="raised">Add book</Button>
      </Link>
      <p />
      <ul>
        {books.map(book => (
          <li key={book._id}>
            <Link
              as={`/admin/book-detail/${book.slug}`}
              href={`/admin/book-detail?slug=${book.slug}`}
            >
              <a>{book.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

Index.propTypes = {
  books: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  })).isRequired,
};

class IndexWithData extends Component {
  state = {
    books: [],
  };

  async componentDidMount() {
    try {
      const { books } = await getBookList();
      this.setState({ books }); // eslint-disable-line
    } catch (err) {
      notify(err);
    }
  }

  render() {
    return <Index {...this.state} />;
  }
}

export default withAuth(withLayout(IndexWithData), { adminRequired: true });
