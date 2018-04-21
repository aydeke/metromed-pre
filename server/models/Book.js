/**
 * ./server/models/Book.js
 */

import mongoose, { Schema } from 'mongoose';
import frontmatter from 'front-matter';

import generateSlug from '../utils/slugify';
import Chapter from './Chapter';

import { getCommits, getContent } from '../github';
import logger from '../logs';

import User from './User';
import Purchase from './Purchase';
import { stripeCharge } from '../stripe';
import getEmailTemplate from './EmailTemplate';
import sendEmail from '../aws';
import getRootUrl from '../../lib/api/getRootUrl';

// const ROOT_URL = process.env.ROOT_URL || `http://localhost:${process.env.PORT}:8000`;
const ROOT_URL = getRootUrl();

const mongoSchema = new Schema({
  // parameters
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  githubRepo: {
    type: String,
    required: true,
  },
  githubLastCommitSha: String,

  createdAt: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

class BookClass {
  // methods

  /**
   * The static and async list() method (static async list())
   * takes two arguments: offset and limit.
   * The method waits (await) until all books are found (this.find())
   * and returns an array of book objects ({}).
   * Inside the list() method, we apply three MongoDB methods
   * to reorganize the array of book objects: .sort(), .skip(), .limit
   */
  static async list({ offset = 0, limit = 10 } = {}) {
    const books = await this.find({})
      // .sort({ createdAt: -1 }) sorts book objects by creation date,
      // from the most to least recently created.
      .sort({ createdAt: -1 })
      // .skip(offset) with offset = 0
      // ensures that we do not skip any books.
      // The default value for the .skip() method is zero,
      // so we don't need to specify it explicitly.
      // However, let's keep the offset argument.
      // We may need later if we decide to add pagination to our list of books.
      .skip(offset)
      // .limit(limit) and limit=10
      // returns no more than 10 books.
      // If we return too many books,
      // MongoDB's query time may be high and user-unfriendly.
      .limit(limit);
    return { books };
  }

  /**
   * The static and async getBySlug() method takes one argument: slug.
   * The main method waits (await) until
   * Mongoose's this.findOne() method finds one book
   * (slug is unique, take a look above at the Book's model Schema).
   */
  static async getBySlug({ slug }) {
    const bookDoc = await this.findOne({ slug });
    if (!bookDoc) {
      // If a book can't be found - we throw an error:
      throw new Error('Book not found');
    }

    // We take the book document we found
    // and convert it into a plain JavaScript object
    // by using Mongoose's toObject method:
    // http://mongoosejs.com/docs/api.html#document_Document-toObject
    const book = bookDoc.toObject();

    // Before we return a JS object from our book with 'return book;',
    // we want to retrieve the book's chapters.
    // Retrieving the book along with its chapters is useful
    // for building a Table of Contents (link to Chapter 6).
    // To find all chapters of a particular book, we use Mongoose's Chapter.find().
    // We search for all chapters with the proper bookId value (bookId: book._id).
    // For each chapter, we retrieve title and slug.
    book.chapters = (await Chapter.find({ bookId: book._id }, 'title slug')
      // We sort our array of chapters with the order parameter
      .sort({ order: 1 }))
      // and go through each chapter document in our array with the .map JS method.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
      .map(chapter => chapter.toObject());

    return book;
  }

  /**
   * The static async add() method takes three arguments:
   * book name, price, and githubRepo.
   */
  static async add({ name, price, githubRepo }) {
    // add() calls and waits for generateSlug() method
    // to return a unique slug for a book.
    const slug = await generateSlug(this, name);

    if (!slug) {
      throw new Error('Error with slug generation');
    }

    // After we get slug, we use Mongoose method create()
    // to create new book document in database.
    // New document gets name, price, githubRepo
    // that are passed from the cient (Admin specifies these values on the AddBook page).
    // New document also gets slug and createdAt patameters.
    return this.create({
      name,
      slug,
      price,
      githubRepo,
      createdAt: new Date(),
    });
  }

  /**
   * The static and async edit() method takes four parameters:
   * id, name, price and githubRepo.
   * This method finds one book by its id
   * with Mongoose's findById() method
   * http://mongoosejs.com/docs/api.html#model_Model.findById
   * (this method uses Mongo's findOne() method).
   */
  static async edit({
    id, name, price, githubRepo,
  }) {
    const book = await this.findById(id, 'slug name');

    if (!book) {
      // Similar to the getBySlug() method,
      // if a book is not found, we throw an error:
      throw new Error('Book is not found by id');
    }

    // If a book is found, we define a modifier variable
    // that points to an object of two parameters:
    const modifier = { price, githubRepo };

    // Then we check if the book's name in our database (book.name)
    // matches a new name (name !== book.name).
    if (name !== book.name) {
      // If it does not, we add a new name to our modifier
      // by extending it (modifier.name = name;).
      modifier.name = name;
      // We also generate and add slug to our modifier:
      modifier.slug = await generateSlug(this, name);
    }

    // Finally, for book found by its id,
    // we modify the book's parameters (name, price and githubRepo)
    // with Mongoose/Mongo's this.updateOne() method.
    // https://docs.mongodb.com/manual/reference/method/db.collection.updateOne/
    // We replace the values of all four parameters (name, slug, price, githubRepo)
    // with new values by using the well-known $set operator that does just that.
    // https://docs.mongodb.com/v3.4/reference/operator/update/set/#up._S_set
    return this.updateOne({ _id: id }, { $set: modifier });
  }

  /**
   * In this subsection, our goal is to use our three API methods
   * to define a static method syncContent() for our Book model.
   * After an Admin user creates a book and decides to get content from Github,
   * our app will execute syncContent()
   * to get all necessary data and save that data to our database.
   * We already defined a static method add() (static async add({ name, price, githubRepo })).
   * Our Admin user sets a name + price
   * and calls add() from pages/admin/add-book.js to create a new book.
   * Our new static method syncContent() updates content for an existing book.
   * In other words, the Admin users calls syncContent()
   * after creating a book on his/her database.
   * syncContent() will be async. The method will find a book by its id
   * and pass a user's githubAccessToken to Github's API methods defined earlier.
   */
  static async syncContent({ id, githubAccessToken }) {
    // 1. await find book by id
    // syncContent() is an async function.
    // Inside it, we will find a book with Mongoose's findById() method:
    // https://mongoosejs.com/docs/api.html#model_Model.findById
    // `Model.findById(id, [projection])`
    // The optional array [projection] is an array of parameter values
    // that we want to return from a Model.
    // In this case, we want to return two book parameters:
    // githubRepo and githubLastCommitSha:
    const book = await this.findById(id, 'githubRepo githubLastCommitSha');

    // 2. throw error if there is no book
    // We did this one many times before.
    // If there is no book (if (!book)), throw an error
    // (throw new Error('some informative text')):
    if (!book) {
      throw new Error('Book not found');
    }

    // 3. get last commit from Github using `getCommits()` API method
    // Here we await for the getCommits() API method
    // to get our repo's latest commit from Github.
    // Remember this method takes three parameters
    // getCommits({ accessToken, repoName, limit }):
    const lastCommit = await getCommits({
      // accessToken to authenticate the user,
      accessToken: githubAccessToken,
      // repoName to get and pass owner and repo,
      repoName: book.githubRepo,
      // limit to limit the number of commits returned.
      // getCommits() returns a list of commits
      // in reverse chronological order.
      // That's why limit: 1 ensures that we get the most recent commit.
      limit: 1,
    });

    // 4. if there is no last commit on Github - no need to sync content, throw error
    // Here we are being overcautious and throw an error in the following three cases:
    // - if there is no list of commits for the repo (if (!lastCommit)) _or_
    // - if there are no elements inside the list of commits (!lastCommit.data) _or_
    // - if there is no first element in the list of commits
    //   (first element has index 0, !lastCommit.data[0])
    if (!lastCommit || !lastCommit.data || !lastCommit.data[0]) {
      // Then we won't extract any data from the repo;
      // instead we will throw an error
      // (throw new Error('some informative text')):
      throw new Error('No change in content!');
    }

    // 5. if last commit's hash on Github's repo is the same as hash saved in database -
    // no need to extract content from repo, throw error
    // First, we define lastCommitSha as lastCommit.data[0].sha.
    // From code snippet 4, you know that lastCommit.data[0]
    // is simply the first element in the list of commits - i.e. the last commit,
    // since the list is ordered in reverse chronology.
    // If the hash of the last commit in the Github repo lastCommitSha
    // is the same as hash saved to the database book.githubLastCommitSha,
    // then all content in the database is up-to-date.
    // No need to extract data, so we throw an error:
    const lastCommitSha = lastCommit.data[0].sha;
    if (lastCommitSha === book.githubLastCommitSha) {
      throw new Error('No change in content!');
    }

    // 6. define repo's main folder with `await` and `getContent()`
    // The main folder in a Github repo has path: ''.
    // Let's defile the mainFolder using the getContent() API method.
    // This method takes three parameters, getContent({ accessToken, repoName, path }):
    const mainFolder = await getContent({
      accessToken: githubAccessToken,
      repoName: book.githubRepo,
      path: '',
    });

    await Promise.all(mainFolder.data.map(async (f) => {
      // 7. check if main folder has files, check title of files
      // As you already know, await pauses code until Promise.all(iterable)
      // returns a single resolved promise after all promises inside iterable have been resolved.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
      // In our case, iterable is .map().
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
      // This JavaScript method iterates through all .md files with proper names inside mainFolder:
      // First, our construct checks if the content inside mainFolder.data is a file.
      if (f.type !== 'file') {
        // If not, the code returns undefined.
        return;
      }

      // Second, our construct checks if a file's path is introduction.md or chapter-d.md.
      if (f.path !== 'introduction.md' && !/chapter-([0-9]+)\.md/.test(f.path)) {
        // If not, the code returns undefined.
        // In this second construct, JavaScript's .test(f.path) tests if f.path equals
        // /chapter-([0-9]+)\.md/ and returns false if not. Read more about .test().
      }

      // 8. define `chapter` with `await` and `getContent()`
      // Here we define chapter using the getContent() API method.
      // You remember that this method takes three parameters
      // getContent({ accessToken, repoName, path }).
      const chapter = await getContent({
        // The method passes accessToken to github.authenticate(),
        accessToken: githubAccessToken,
        // splits repoName to extract repo and owner,
        repoName: book.githubRepo,
        // and uses path to specify a repo file to get content from.
        path: f.path,
      });

        // 9. Extract content from each qualifying file in repo
        // After we define chapter, we need to extract content from the .md file.
        // We use the front-matter package to extract data:
        // https://www.npmjs.com/package/front-matter
        // Using front-matter is straightforward,
        // check up an official example - frontmatter(string):
        // https://github.com/jxson/front-matter#example
        // Below, we use this method to extract data from the utf8 string:
      const data = frontmatter(Buffer.from(chapter.data.content, 'base64').toString('utf8'));
      // You might get confused by the argument inside frontmatter():
      // Buffer.from(chapter.data.content, 'base64').toString('utf8')
      // Buffer is a class in Node designed for handling raw binary data:
      // https://nodejs.org/api/buffer.html#buffer_buffer
      // Github API methods return base64 encoded content (see docs):
      // https://developer.github.com/v3/repos/contents/
      // Thus, we use Buffer to handle base64-encoded chapter.data.content content from Github.
      // We handle binary data from Github by using Buffer.from(string[, encoding]).
      // This method creates a new Buffer that contains a copy of the provided string:
      // https://nodejs.org/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe
      // Buffer.from(chapter.data.content, 'base64')
      // Then we use the .toString([encoding]) method to convert binary data to a utf-8 string:
      // https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end
      // .toString('utf8')
      // Though not important for building this app,
      // you are welcome to read more about base64 and utf-8.
      // https://en.wikipedia.org/wiki/Base64#Examples
      // https://en.wikipedia.org/wiki/UTF-8#Examples

      // 10. For each file, run `Chapter.syncContent({ book, data })`
      // Here we pass data from code snippet 9 to the syncContent() static method
      // inside our Chapter model: Chapter.syncContent({ book, data }).
      // We pass book data as well. As you may guess,
      // this particular syncContent() creates a chapter document in the Chapter collection.
      // This chapter document contains the proper bookId (from book data)
      // and proper content (from data). Example of code that creates a chapter document:
      // return this.create({
      //   bookId: book._id,
      //   githubFilePath: path,
      //   content: body,
      //   // more parameters
      // });
      // You see that the githubFilePath parameter is simply path,
      // so we have to pass path to data with:
      // data.path = f.path
      // As always, let's use the try/catch construct:
      data.path = f.path;

      try {
        await Chapter.syncContent({ book, data });
        logger.info('Content is synced', { path: f.path });
      } catch (error) {
        logger.error('Content sync has error', { path: f.path, error });
      }
    }));

    // 11. Return book with updated `githubLastCommitSha`
    // We want syncContent() in our Book model
    // to return a book with an updated githubLastCommitSha parameter
    // (this is the hash of the repo's latest commit from Github):
    return book.update({ githubLastCommitSha: lastCommitSha });
  }

  static async buy({ id, user, stripeToken }) {
    if (!user) {
      throw new Error('User required');
    }

    // 1. find book by id
    const book = await this.findById(id, 'name slug price');

    if (!book) {
      throw new Error('Book not found');
    }

    // 2. check if user bought book already
    const isPurchased = (await Purchase.find({ userId: user._id, bookId: id }).count()) > 0;
    if (isPurchased) {
      throw new Error('Already bought this book');
    }

    // 3. call stripeCharge() method
    // We pass three arguments to the stripeCharge() method:
    const chargeObj = await stripeCharge({
      // book.price from book as amount,
      amount: book.price * 100,
      // stripeToken.id from stripeToken as token,
      // (we passed this to the server from client via our buyBook API method)
      token: stripeToken.id,
      // user.email from user as buyerEmail.
      buyerEmail: user.email,
    });

    // This statement finds and updates a user who bought a book:
    User.findByIdAndUpdate(user.id, { $addToSet: { purchasedBookIds: book.id } }).exec();

    // 4. send transactional email confirming purchase
    const template = await getEmailTemplate('purchase', {
      userName: user.displayName,
      bookTitle: book.name,
      bookUrl: `${ROOT_URL}/books/${book.slug}/introduction`,
    });

    try {
      await sendEmail({
        from: `Kelly from builderbook.org <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [user.email],
        subject: template.subject,
        body: template.message,
      });
    } catch (error) {
      logger.error('Email sending error:', error);
    }

    try {
      // The subscribe() method will take a user's email
      // and add it to a Mailchimp list.
      // The list name is not the actual name of
      // the list on your Mailchimp dashboard
      // but the name of the variable that points to a unique List ID.
      await subscribe({ email: user.email });
    } catch (error) {
      logger.error('Mailchimp error:', error);
    }

    // 5. create new Purchase document
    return Purchase.create({
      userId: user._id,
      bookId: book._id,
      amount: book.price * 100,
      stripeCharge: chargeObj,
      createdAt: new Date(),
    });
  }

  static async getPurchasedBooks({ purchasedBookIds }) {
    // $in allows to find all documents with a field value matching
    // one of the values inside an array: { field: { $in: [, , ...  ] } }
    const purchasedBooks = await this.find({ _id: { $in: purchasedBookIds } }).sort({
      createdAt: -1,
    });
    return { purchasedBooks };
  }
}

mongoSchema.loadClass(BookClass);

const Book = mongoose.model('Book', mongoSchema);

export default Book;
