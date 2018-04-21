/** ./pages/admin/add-book.js
 *
 * The page add-book.js is straightforward.
 * Most of this page's interface comes from the EditBook component.
 * We need to achieve this:
 * - Admin clicks on the form's Save button to call the addBook() method
 *   and pass a book's data to this method.
 *   That's why we wrote an addBookOnSave function inside the EditBook component.
 * - Once our Admin clicks Save, the EditBook component does three things:
 *   1) submits the form
 *   2) passes the book's name, price, and githubRepo (as this.state.book)
 *      to the onSave function
 *   3) calls the onSave function
 */

import React from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';

import withLayout from '../../lib/withLayout';
import withAuth from '../../lib/withAuth';
import EditBook from '../../components/admin/EditBook';
import { addBook, syncBookContent } from '../../lib/api/admin';
import notify from '../../lib/notifier';

class AddBook extends React.Component {
  /**
   * We call addBookOnSave() with <EditBook onSave={this.addBookOnSave} />
   * Note that data is this.state.book, because we defined
   * onSave() function as onSave(this.state.book)
   * (see the EditBook component).
   */
  addBookOnSave = async (data) => {
    // The Admin has to wait a bit for the API method to return a response
    // (with data for GET requests, without data for POST requests).
    // Thus we use NProgress.start(); before we call await addBook(),
    // and we call NProgress.done(); after it.
    NProgress.start();

    try {
      // To create a new book,
      // we want the addBookOnSave function to call the API method addBook().
      // The API method addBook() returns a book object.
      const book = await addBook(data);
      notify('Saved');
      try {
        const bookId = book._id;
        // Then we wait for the API method syncBookContent()
        // to sync content with Github:
        await syncBookContent({ bookId });
        // When done, we display success with notify():
        notify('Synced');
        // Also we let the loading Nprogress bar finish with NProgress.done():
        NProgress.done();
        // At the end, our app should redirect the Admin to the BookDetail page
        // (pages/admin/book-detail.js) with Next.js's Router.push()
        // https://github.com/zeit/next.js#imperatively:
        Router.push(`/admin/book-detail?slug=${book.slug}`, `/admin/book-detail/${book.slug}`);
      } catch (err) {
        notify(err);
        NProgress.done();
      }
    } catch (err) {
      notify(err);
      NProgress.done();
    }
  };

  render() {
    return (
      <div style={{ padding: '10px 45px' }}>
        <EditBook onSave={this.addBookOnSave} />
      </div>
    );
  }
}

export default withAuth(withLayout(AddBook));
