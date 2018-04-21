/**
 * ./server/models/Chapter.js
 */

import mongoose, { Schema } from 'mongoose';
import marked from 'marked';
import he from 'he';
import hljs from 'highlight.js';
import generateSlug from '../utils/slugify';
import Book from './Book';
import Purchase from './Purchase';

/**
 * This function will take markdown content as a parameter
 * and return an HTML content: return marked(he.decode(content)).
 * To convert content from markdown to HTML:
 * const htmlContent = markdownToHtml(content)
 * To convert an excerpt from markdown to HTML:
 * const htmlExcerpt = markdownToHtml(excerpt)
 */
function markdownToHtml(content) {
  // Once we have chapter.content,
  // we save it to our database with the syncContent() static method of our Chapter model.
  // Markdown content is nice, and you probably like using Github markdown.
  // https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
  // We use markdown content to compare content on our database with content on Github,
  // then decide whether we should update the content on our database or not.
  // However, we cannot render markdown content directly on the browser.

  // To render on the browser, we need to convert markdown content to HTML htmlContent.
  // The marked package is a markdown parser and does exactly that.
  // https://www.npmjs.com/package/marked
  // In other words, when we write **some text**,
  // marked can convert it into <b>some text</b>,
  // and a user will see 'some text' on his/her browser.

  // Marked is straigforward to use. In our case, we will parse chapter content with:
  // marked(content)

  // We can configure marked and modify rules
  // that specify how marked renders some elements of markdown.
  // You can configure marked renderer with new marked.Renderer().
  // https://www.npmjs.com/package/marked#overriding-renderer-methods
  const renderer = new marked.Renderer();

  // Customizing renderer looks like:
  renderer.link = (href, title, text) => {
    const t = title ? ` title="${title}"` : '';
    // For example, we would like every external link in our app to have these attributes:
    // rel="noopener noreferrer" target="_blank"
    return `<a target="_blank" href="${href}" rel="noopener noreferrer"${t}>${text}</a>`;
  };

  // Besides customizing link, we would like to customize images with:
  renderer.image = href => `<img
      src="${href}"
      style="border: 1px solid #ddd;"
      width="100%"
      alt="Builder Book"
      >`;
  // We want all images to fit inside the page (width="100%")
  // and have a border around them (style="border: 1px solid #ddd;").

  // Finally, we want to customize the conversion of headings,
  // in particular ## (<h2>) and #### (<h4>):
  renderer.heading = (text, level) => {
    const escapedText = text
      .trim()
      .toLowerCase()
      .replace(/[^\w]+/g, '-');

    // Here, we specified the rule for conversion of the <h2> heading.
    // We will use class="section-anchor" to the <span> element
    // to detect all <span> elements and match them to sections in the TOC.
    // When matched, we will highlight corresponding section (<h2>) in the TOC.
    if (level === 2) {
      return `<h${level} class="chapter-section" style="color: #222; font-weight: 400;">
        <a
          name="${escapedText}"
          href="#${escapedText}"
          style="color: #222;"
        > 
          <i class="material-icons"
            style="vertical-align: middle; opacity: 0.5; cursor: pointer;">link</i>
        </a>
        <span class="section-anchor" name="${escapedText}">
          ${text}
        </span>
        ${text}
      </h${level}>`;
    }

    if (level === 4) {
      return `<h${level} style="color: #222;">
          <a
            name="${escapedText}"
            href="#${escapedText}"
            style="color: #222;"
          >
            <i class="material-icons"
              style="vertical-align: middle; opacity: 0.5; cursor: pointer;">link</i>
          </a>
          ${text}
        </h${level}>`;
    }

    return `<h${level} style="color: #222; font-weight: 400;">${text}</h${level}>`;
  };

  // Notice that we added a hyperlinked Material icon in front of the heading's text: 🔗
  // This icon loads from Google CDN,
  // which you may recall from Chapter 1 when customizing <Document>.
  // Open pages/_document.js -
  // we added the following <link> tag to the <Head> section of our custom document:
  // <link
  //   rel="stylesheet"
  //   href="https://fonts.googleapis.com/icon?family=Material+Icons"
  // />

  // We want this icon in front of the heading text to have a unique link,
  // so users can share links to particular sections
  // or subsections (href="#${escapedText}")) of a chapter.
  // We also want the page to scroll to an anchor (name="${escapedText}")
  // when a user clicks the hyperlinked icon.

  // We've applied class="chapter-section" to our <h2> heading.
  // We will use this class in Chapter 7 to detect an in-view section
  // and highlight the corresponding section inside our Table of Content.

  // The marked package does not come with default highlighting of code.
  // To highlight contents in the <code> tag, marked offers multiple options:
  // https://www.npmjs.com/package/marked#highlight
  // We will use the synchronous example that uses the highlight.js package:
  // https://www.npmjs.com/package/highlight.js
  // This package works with any markup and detects language automatically.

  // After importing hljs from the highlight.js package,
  // we set our marked options with marked.setOptions() (see usage docs)
  // https://www.npmjs.com/package/marked#usage:
  marked.setOptions({
    renderer,
    // We also specified breaks: true, so marked recognizes and adds line breaks.
    breaks: true,
    highlight(code, lang) {
      if (!lang) {
        // If a language is not specified, we rely on automatic detection:
        return hljs.highlightAuto(code).value;
      }
      // If a language (lang) is specified, we pass it to hljs.highlightAuto():
      return hljs.highlight(lang, code).value;
    },
  });

  // In Chapter 5, section Testing,
  // we tested rendering of htmlContent on our ReadChapter page.
  // We briefly discussed HTML elements with class names that start with hljs.
  // Now you know where these class names come from -
  // marked adds classes to text inside <pre> and <code> tags to highlight that text.
  // In our case, marked recognizes code to be JavaScript
  // and adds class name and highlights accordingly.

  // Converting markdown with marked works well with the exception of HTML entities.
  // https://developer.mozilla.org/en-US/docs/Glossary/Entity
  // For example, the entity " stands for character ".
  // Github encodes characters into entities.
  // And we have to decode entities back into characters
  // before we show content to the users in our web app.
  // We will use the he package to achieve that.
  // This package provides us with both he.encode() and he.decode() methods.
  // We need to use the latter.

  // To convert markdown to HTML, we will use:
  // marked(he.decode(chapter.content))
  // instead of:
  // marked(content);
  return marked(he.decode(content));
}

/**
 * Similar to markdownToHtml(content), let's define a getSections(content) function.
 * This function takes markdown content and outputs a sections array.
 * This array contains sections for our Table of Contents -
 * every <h2> tag inside the content becomes a section inside the Table of Contents.
 *
 * To make a sections array:
 * const sections = getSections(content)
 * Example: if your markdown content has: '## Why this book?'
 * Then getSections(content) will return this array: [
 *   {
 *     "text": "Why this book?",
 *     "level": 2,
 *     "escapedText": "why-this-book-"
 *   },
 * ]
 */
function getSections(content) {
  const renderer = new marked.Renderer();

  const sections = [];

  // Marked parses markdown content
  // and finds headings with level equal to 2 (any heading that has ##):
  renderer.heading = (text, level) => {
    if (level !== 2) {
      return;
    }

    // We hyperlink sections on our Table of Contents using escapedText,
    // but more on this in Chapter 7.
    const escapedText = text
      .trim()
      .toLowerCase()
      .replace(/[^\w]+/g, '-');

    // For every heading, we push an object to the sections array:
    sections.push({ text, level, escapedText });
  };

  marked.setOptions({
    renderer,
  });

  marked(he.decode(content));

  return sections;
}

const mongoSchema = new Schema({
  // Parameters. Each Chapter needs createdAt (creation date),
  // title, slug (generated from title), seoTitle, and seoDescription.
  createdAt: {
    type: Date,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  // We use the seoTitle, and seoDescription parameters
  // to display a title and description to Googlebot
  // for proper indexing of our web app.
  seoTitle: String,
  seoDescription: String,

  // To find and fetch all chapters that belong to one book - we use bookId.
  bookId: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  // Some chapters - for example the first chapter that we call "Introduction" -
  // will be completely free with no paywall hiding their content.
  // We use the boolean parameter isFree and set the default value to false.
  // But for free chapters, such as Introduction chapter, we set the value to true.
  isFree: {
    type: Boolean,
    required: true,
    default: false,
  },

  // Every chapter should have:
  // content (markdown content),
  content: {
    type: String,
    default: '',
    required: true,
  },
  // htmlContent (HTML content),
  htmlContent: {
    type: String,
    default: '',
    required: true,
  },
  // excerpt (markdown content that is free to all visitors,
  // even if they didn't sign up or buy a book),
  excerpt: {
    type: String,
    default: '',
  },
  // htmlExcerpt (HTML excerpt)
  htmlExcerpt: {
    type: String,
    default: '',
  },
  // and githubFilePath (path inside our github repo
  // that points to the .md file containing the chapter's content).
  githubFilePath: {
    type: String,
    unique: true,
  },

  // The final parameter is order.
  // This is the ordinal number that is extracted from each chapter's title
  // and used to order chapters inside our table of contents.
  // Note that the Introduction chapter is always first thus "order": 1.
  order: {
    type: Number,
    required: true,
  },

  // In the Markdown to HTML section of Chapter 6,
  // we discuss how to convert markdown content to HTML.
  // In the same section, we will discuss how to make array sections.
  sections: [
    {
      text: String,
      level: Number,
      escapedText: String,
    },
  ],
});

class ChapterClass {
  // methods
  /**
   * The only static method we need to create for ChapterClass is getBySlug().
   */
  static async getBySlug({
    bookSlug, chapterSlug, userId, isAdmin,
  }) {
    // finds a book by its slug:
    const book = await Book.getBySlug({ slug: bookSlug });

    if (!book) {
      // if unsuccessful, it throws an error:
      throw new Error('Not found');
    }

    // if successful, the method finds a chapter by its slug:
    const chapter = await this.findOne({ bookId: book._id, slug: chapterSlug });

    if (!chapter) {
      throw new Error('Not found');
    }

    // finally, the method converts MongoDB documents (Chapter and Book)
    // into plain JS objects:
    const chapterObj = chapter.toObject();
    chapterObj.book = book;

    if (userId) {
      const purchase = await Purchase.findOne({ userId, bookId: book._id });

      chapterObj.isPurchased = !!purchase || isAdmin;
    }

    const isFreeOrPurchased = chapter.isFree || chapterObj.isPurchased;

    if (!isFreeOrPurchased) {
      delete chapterObj.htmlContent;
    }

    return chapterObj;
  }

  /**
   * We passed book and data to our Chapter model with Chapter.syncContent({ book, data });.
   * This method will create a chapter document in the Chapter collection
   * _or_ if the document already exists, that document will be updated.
   *
   * Before we continue, we need to understand the structure of data
   * returned by the front-matter package. For a Github .md file that looks like:
   * ---
   * title: Just hack'n
   * description: Nothing to see here
   * ---
   * This is some text about some stuff that happened sometime ago
   *
   * frontmatter() method returns:
   * {
   *   attributes: {
   *     title: 'Just hack\'n',
   *     description: 'Nothing to see here'
   *   },
   *   body: '\nThis is some text about some stuff that happened sometime ago',
   *   frontmatter: 'title: Just hack\'ndescription: Nothing to see here'
   * }
   */
  static async syncContent({ book, data }) {
    // Now that we know the structure, we use ES6 object destructuring for
    // data.attributes.title, data.attributes.excerpt, data.attributes.isFree,
    // data.attributes.seoTitle, data.attributes.seoDescription, data.body, and data.path:
    const {
      title,
      excerpt = '',
      isFree = false,
      seoTitle = '',
      seoDescription = '',
    } = data.attributes;

    const { body, path } = data;
    // body (defined as data.body) is the markdown content of .md file
    // or markdown content of a chapter (chapter.content). In other words:
    // const content = body;

    // Remember that we defined data.path = f.path in syncContent() of our Book model.
    // Next, let's assume the chapter document exists.
    // In this case, we attempt to find it with Mongoose's findOne().
    // We search using two parameters: bookId and githubFilePath:
    const chapter = await this.findOne({
      bookId: book.id,
      githubFilePath: path,
    });
    // Remember that we passed the book object
    // with syncContent({ book, data }) and bookId: book.id.
    // We defined path with const { body, path } = data;
    // and passed it with data.path = f.path.

    // We also need a parameter to specify the order
    // in which a chapter is displayed inside the Table of Contents.
    // For example, we want a chapter with content from introduction.md to have order = 1
    // and a chapter with content from chapter-1.md to have order = 2:
    let order;

    if (path === 'introduction.md') {
      order = 1;
    } else {
      order = parseInt(path.match(/[0-9]+/), 10) + 1;
    }

    const content = body;
    const htmlContent = markdownToHtml(content);
    const htmlExcerpt = markdownToHtml(excerpt);
    const sections = getSections(content);

    // We would like to find a number inside each chapter's path.
    // For example, for path chapter-3.md, we want to return order = 4
    // (introduction chapter with path introduction.md has order = 1).
    // To do so, we use JavaScript's methods str.match(regexp)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    // and parseInt(string, radix).
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt

    // The first JavaScript method finds regexp inside str.
    // In our case, regexp or regular expression is a digit, and str is a path.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    // Regular expression for digit is [0-9] or /d.
    // In order to find multiple digits inside a string, we add +.
    // Without +, we will not get order = 14 for the path chapter-13.md,
    // since only 1 will be found instead of 13.

    // The second JavaScript method parses the resulting string
    // and returns the integer that it finds.
    // Radix is 10, since we want to return a decimal system integer.
    // If we don't use parseInt(), then instead of adding 1 to the number,
    // we will join 1 to the string and return a joint string.
    // For example, without parseInt(),
    // the order for path chapter-3.md will be 31 instead of 4.
    // Moreover, the order will be a string, not a number.

    // Whenever possible, when using JavaScript methods,
    // we like to test out code on our browser console.
    // Go to Chrome's Developer tools, click Console, and paste the following code:
    // path = 'chapter-3.md';
    // order = parseInt(path.match(/[0-9]+/), 10) + 1;
    // console.log(typeof order, order);
    // Run the code by clicking Enter. As expected, the output is number 4.
    // Try removing + from [0-9]+ and replacing chapter-3.md with chapter-13.md.
    // path = 'chapter-13.md';
    // order = parseInt(path.match(/[0-9]/), 10) + 1;
    // console.log(typeof order, order);
    // Run the code. The order will be 2 instead of 14.
    // Add + back and replace chapter-13.md with chapter-3.md.
    // Remove the parseInt() function and run the code.
    // path = 'chapter-3.md';
    // order = path.match(/[0-9]+/, 10) + 1;
    // console.log(typeof order, order);
    // The output is string 31 instead of number 4, but this is hardly a surprise to us.

    // 1. If chapter document does not exist,
    // then create slug and create document with all parameters.
    // To create a new chapter document, we use Mongoose's Model.create() method.
    // Check up how we did it for the User model at server/models/User.js.
    // Before we call this method, we have to call and await
    // for generateSlug(Model, title) to generate the chapter's slug from its title:
    if (!chapter) {
      const slug = await generateSlug(this, title, { bookId: book._id });

      return this.create({
        bookId: book._id,
        githubFilePath: path,
        title,
        slug,
        isFree,
        content,
        htmlContent,
        sections,
        excerpt,
        htmlExcerpt,
        order,
        seoTitle,
        seoDescription,
        createdAt: new Date(),
      });
    }
    // Take a look at server/utils/slugify.js if you need to remember
    // how the generateSlug(Model, name, filter = {}) function works.

    // 2. Else, define modifier for parameters:
    // content, htmlContent, sections, excerpt, htmlExcerpt,
    // isFree, order, seoTitle, seoDescription
    // When a chapter document already exists
    // and our Admin user calls syncContent() on the Chapter model,
    // then we want to update (as in, overwrite) the chapter's parameters.
    // Let's define a modifier object as:
    const modifier = {
      content,
      htmlContent,
      sections,
      excerpt,
      htmlExcerpt,
      isFree,
      order,
      seoTitle,
      seoDescription,
    };
    // In case the book's title is changed,
    // we should re-generate slug
    // and extend our modifier object with title and slug parameters:
    if (title !== chapter.title) {
      modifier.title = title;
      modifier.slug = await generateSlug(this, title, {
        bookId: chapter.bookId,
      });
    }

    // 3. Update existing document with modifier.
    // Mongoose's method Model.updateOne()
    // http://mongoosejs.com/docs/api.html#model_Model.updateOne
    // updates a single chapter document that has a matching _id:
    return this.updateOne({ _id: chapter._id }, { $set: modifier });
    // As you know from writing the User model,
    // the $set operator replaces a parameter's value with a specified value.
    // https://docs.mongodb.com/manual/reference/operator/update/set/index.html
  }
}

mongoSchema.index({ bookId: 1, slug: 1 }, { unique: true });
mongoSchema.index({ bookId: 1, githubFilePath: 1 }, { unique: true });

mongoSchema.loadClass(ChapterClass);

const Chapter = mongoose.model('Chapter', mongoSchema);

export default Chapter;
