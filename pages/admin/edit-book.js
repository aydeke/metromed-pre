/** ./pages/admin/edit-book.js
 *
 * The page edit-book.js is a bit more complex than add-book.js.
 * In addition to calling the API method editBook(),
 * we have to display the book's current data with another API method, getBookDetail().
 */

import React from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import Error from 'next/error';

import EditBookComp from '../../components/admin/EditBook';
import { getBookDetail, editBook } from '../../lib/api/admin';
import withLayout from '../../lib/withLayout';
import withAuth from '../../lib/withAuth';
import notify from '../../lib/notifier';

class EditBook extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired,
  };

  // In addition to calling the API method editBook(),
  // we have to display the book's current data with another API method, getBookDetail().
  // We do so with Next.js's getInitialProps():
  static getInitialProps({ query }) {
    return { slug: query.slug };
  }

  state = {
    error: null,
    book: null,
  };

  async componentDidMount() {
    NProgress.start();

    try {
      // and with our getBookDetail() API method inside the componentDidMount lifecycle hook:
      const book = await getBookDetail({ slug: this.props.slug });
      this.setState({ book }); // eslint-disable-line
      NProgress.done();
    } catch (err) {
      this.setState({ error: err.message || err.toString() }); // eslint-disable-line
      NProgress.done();
    }
  }

  // Next, we need to make sure that when our Admin clicks the Save button,
  // we call the API method editBook().
  // We make sure that after form submission,
  // the onSave function points to the internal editBookOnSave function:
  // <EditBookComp onSave={this.editBookOnSave} book={book} />
  editBookOnSave = async (data) => {
    // Again, data inside the editBookOnSave = async (data) function
    // is this.state.book, because we defined our onSave() function
    // as onSave(this.state.book) (in the EditBook component),
    // and we pointed onSave() to editBookOnSave(): onSave={this.editBookOnSave}.
    const { book } = this.state;
    NProgress.start();

    try {
      // We call the editBook() API method inside the editBook() function.
      // You'll notice that unlike passing data without modification (addBook(data);),
      // here we add an id to our data.
      // Thus the syntax is editBook({ ...data, id: book._id }); instead of editBook(data);.
      await editBook({ ...data, id: book._id });
      // Note that after editBook() finishes editing a book,
      // we indicate this to user with notify()
      notify('Saved');
      // and Nprogress.done().
      NProgress.done();
      // At the end, our app redirects the Admin user
      // to the BookDetail page (pages/admin/book-detail.js)
      // that we introduce later in this chapter.
      Router.push(`/admin/book-detail?slug=${book.slug}`, `/admin/book-detail/${book.slug}`);
    } catch (err) {
      notify(err);
      NProgress.done();
    }
  };

  render() {
    const { book, error } = this.state;

    if (error) {
      notify(error);
      return <Error statusCode={500} />;
    }

    if (!book) {
      return null;
    }

    return (
      <div>
        {/* Passing the book prop to our EditBook component with <EditBookComp book={book} /> */}
        <EditBookComp onSave={this.editBookOnSave} book={book} />
      </div>
    );
  }
}

export default withAuth(withLayout(EditBook));
