/**
 * ./pages/public/read-chapter.js
 */

import React from 'react';
import PropTypes from 'prop-types';
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';

import { getChapterDetail } from '../../lib/api/public';
import withLayout from '../../lib/withLayout';
import withAuth from '../../lib/withAuth';
import Header from '../../components/Header';
import BuyButton from '../../components/customer/BuyButton';

const styleIcon = {
  opacity: '0.5',
  fontSize: '24',
  cursor: 'pointer',
};

class ReadChapter extends React.Component {
  static propTypes = {
    chapter: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
    url: PropTypes.shape({
      asPath: PropTypes.string.isRequired,
    }).isRequired,
    showStripeModal: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    chapter: null,
  };

  // getInitialProps passes data to API method getChapterDetail():
  static async getInitialProps({ req, query }) {
    // 1. call API method, pass neccessary data to server

    // In Next.js, query is a query string section of a URL
    // (similar to Express's req.query and req.params).
    // By using ES6 destructuring,
    // we get bookSlug and chapterSlug from query:
    const { bookSlug, chapterSlug } = query;

    // By using req.headers.cookie,
    // we can pass cookies from client (browser) to the server
    // to identify logged-in user (see the section on Session in Chapter 2):
    const headers = {};
    if (req && req.headers && req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    }

    // Finally, to pass bookSlug, chapterSlug, and headers
    // to the server via our API method getChaperDetail():
    const chapter = await getChapterDetail({ bookSlug, chapterSlug }, { headers });

    const showStripeModal = req ? req.query.buy : window.location.search.includes('buy=1');

    return { chapter, showStripeModal };
  }

  // In React, constructor(props) sets an initial state
  // and is called before a component is mounted.
  // In our case, initial state is simply:
  constructor(props, ...args) {
    // The official React docs advise to
    // always call super(props) before any statement
    // (to make this.props available inside constructor
    // since this is not initialized until super() is called)
    // and initiate state with this.state instead of setState.
    // https://reactjs.org/docs/react-component.html#constructor
    super(props, ...args);
    // Note that we used chapter prop
    const { chapter } = props;
    // and htmlContent that we will define using chapter
    let htmlContent = '';
    if (chapter && (chapter.isPurchased || chapter.isFree)) {
      htmlContent = chapter.htmlContent;
    } else {
      htmlContent = chapter.htmlExcerpt;
    }

    // 2. define state
    this.state = {
      showTOC: false,
      chapter,
      htmlContent,
      hideHeader: false,
      isMobile: false,
    };
  }

  componentDidMount() {
    document.getElementById('main-content').addEventListener('scroll', this.onScroll);

    const isMobile = window.innerWidth < 768;

    if (this.state.isMobile !== isMobile) {
      this.setState({ isMobile }); // eslint-disable-line
    }
  }

  // componentWillReceiveProps(nextProps) is invoked
  // before a mounted component receives new props.
  // This lifecycle will get executed even when props have not changed,
  // thus it is important to compare this.props(current) and nextProps (incoming).
  // To re-render component, we update state with this.setState()
  // (same way as in componentDidMount()).
  componentWillReceiveProps(nextProps) {
    // 3. render new chapter
    // If incoming prop chapter exists (const chapter = nextProps.chapter
    // or with ES6 object destructuring: const { chapter } = nextProps)
    const { chapter } = nextProps;
    // and chapter id has changed (chapter._id !== this.props.chapter._id),
    if (chapter && chapter._id !== this.props.chapter._id) {
      document.getElementById('chapter-content').scrollIntoView();
      // then a user navigated to new chapter (component did receive new chapter prop).
      // const { htmlContent } = chapter;
      let htmlContent = '';
      if (chapter && (chapter.isPurchased || chapter.isFree)) {
        htmlContent = chapter.htmlContent;
      } else {
        htmlContent = chapter.htmlExcerpt;
      }
      // If user navigated to new chapter,
      // we want to re-render page component with this.setState():
      this.setState({ chapter, htmlContent });
    }
  }

  componentWillUnmount() {
    document.getElementById('main-content').removeEventListener('scroll', this.onScroll);
  }

  onScroll = throttle(() => {
    this.onScrollActiveSection();
    this.onScrollHideHeader();
  }, 500);

  onScrollActiveSection = () => {
    const sectionElms = document.querySelectorAll('.section-anchor');
    let activeSection;

    let aboveSection;
    for (let i = 0; i < sectionElms.length; i += 1) {
      const s = sectionElms[i];
      const b = s.getBoundingClientRect();
      const anchorBottom = b.bottom;

      if (anchorBottom >= 0 && anchorBottom <= window.innerHeight) {
        activeSection = {
          hash: s.attributes.getNamedItem('name').value,
        };

        break;
      }

      if (anchorBottom > window.innerHeight && i > 0) {
        if (aboveSection.bottom <= 0) {
          activeSection = {
            hash: sectionElms[i - 1].attributes.getNamedItem('name').value,
          };
          break;
        }
      } else if (i + 1 === sectionElms.length) {
        activeSection = {
          hash: s.attributes.getNamedItem('name').value,
        };
      }

      aboveSection = b;
    }

    if (!isEqual(this.state.activeSection, activeSection)) {
      this.setState({ activeSection });
    }
  };

  onScrollHideHeader = () => {
    const distanceFromTop = document.getElementById('main-content').scrollTop;
    const hideHeader = distanceFromTop > 500;

    if (this.state.hideHeader !== hideHeader) {
      this.setState({ hideHeader });
    }
  };

  /**
   * This function gets executed when a user clicks on on format_list_bulleted icon.
   */
  toggleChapterList = () => {
    this.setState({ showTOC: !this.state.showTOC });
  };

  closeTocWhenMobile = () => {
    this.setState({ showTOC: !this.state.isMobile });
  };

  renderMainContent() {
    const { user, showStripeModal } = this.props;

    const {
      chapter, htmlContent, showTOC, isMobile,
    } = this.state;

    const { book } = chapter;

    let padding = '20px 20%';
    if (!isMobile && showTOC) {
      padding = '20px 10%';
    } else if (isMobile) {
      padding = '0px 10px';
    }

    return (
      <div style={{ padding }} id="chapter-content">
        <h2 style={{ fontWeight: '400', lineHeight: '1.5em' }}>
          {chapter.order > 1 ? `Chapter ${chapter.order - 1}: ` : null}
          {chapter.title}
        </h2>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        {!chapter.isPurchased && !chapter.isFree ? (
          <BuyButton user={user} book={chapter.book} showModal={showStripeModal} />
        ) : null}
      </div>
    );
  }

  /** renderSections() function
   * This function returns a list of hyperlinked sections for one chapter.
   * We will use text as text inside <a>{text}</a> and use escapedText for href.
   * When a user clicks on a hyperlinked section inside the TOC,
   * we want the page to scroll to the beginning of that section.
   * In fact, when we wrote our markdownToHtml() function in Chapter 6,
   * we defined the <h2> heading as follows:
   */
  renderSections() {
    const { sections } = this.state.chapter;

    const { activeSection } = this.state;
    console.log(activeSection);

    if (!sections || !sections.length === 0) {
      return null;
    }

    return (
      <ul>
        {sections.map(s => (
          <li key={s.escapedText} style={{ paddingTop: '10px' }}>
            <a
              style={{
                color: activeSection && activeSection.hash === s.escapedText ? '#1565C0' : '#222',
              }}
              href={`#${s.escapedText}`}
              onClick={this.closeTocWhenMobile}
            >
              {s.text}
            </a>{' '}
          </li>
        ))}
      </ul>
    );
  }

  /**
   * renderSidebar() function returns a list of hyperlinked titles for all chapters
   * and includes renderSections() under each chapter's title
   */
  renderSidebar() {
    const {
      showTOC, chapter, hideHeader, isMobile,
    } = this.state;

    if (!showTOC) {
      return null;
    }

    const { book } = chapter;
    const { chapters } = book;

    return (
      <div
        style={{
          textAlign: 'left',
          position: 'absolute',
          bottom: 0,
          top: hideHeader ? 0 : '64px',
          transition: 'top 0.5s ease-in',
          left: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: isMobile ? '100%' : '300px',
          padding: '0px 25px',
        }}
      >
        {' '}
        <p style={{ padding: '0px 40px', fontSize: '17px', fontWeight: '400' }}>{book.name}</p>
        <ol start="0" style={{ padding: '0 25', fontSize: '14px', fontWeight: '300' }}>
          {chapters.map((ch, i) => (
            <li
              key={ch._id}
              role="presentation"
              style={{ listStyle: i === 0 ? 'none' : 'decimal', paddingBottom: '10px' }}
            >
              <Link
                prefetch
                as={`/books/${book.slug}/${ch.slug}`}
                href={`/public/read-chapter?bookSlug=${book.slug}&chapterSlug=${ch.slug}`}
              >
                <a // eslint-disable-line
                  style={{ color: chapter._id === ch._id ? '#1565C0' : '#222' }}
                  onClick={this.closeTocWhenMobile}
                >
                  {ch.title}
                </a>
              </Link>
              {chapter._id === ch._id ? this.renderSections() : null}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  render() {
    const { user, url } = this.props;

    console.log(url.asPath);

    const {
      chapter, showTOC, hideHeader, isMobile,
    } = this.state;

    if (!chapter) {
      return <Error statusCode={404} />;
    }

    let left = 20;
    if (showTOC) {
      left = isMobile ? '100%' : '320px';
    }

    return (
      <div>
        <Head>
          <title>
            {chapter.title === 'Introduction'
              ? 'Introduction'
              : `Chapter ${chapter.order - 1}. ${chapter.title}`}
          </title>
          {chapter.seoDescription ? (
            <meta name="description" content={chapter.seoDescription} />
          ) : null}
        </Head>

        <Header user={user} hideHeader={hideHeader} redirectUrl={url.asPath} />

        {this.renderSidebar()}

        <div
          style={{
            textAlign: 'left',
            padding: '0px 10px 20px 30px',
            position: 'fixed',
            right: 0,
            bottom: 0,
            top: hideHeader ? 0 : '64px',
            transition: 'top 0.5s ease-in',
            left,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: '1000',
          }}
          id="main-content"
        >
          <div
            style={{
              position: 'fixed',
              top: hideHeader ? '20px' : '80px',
              transition: 'top 0.5s ease-in',
              left: '15px',
            }}
          >
            <i //eslint-disable-line
              className="material-icons"
              style={styleIcon}
              onClick={this.toggleChapterList}
              onKeyPress={this.toggleChapterList}
              role="button"
            >
              format_list_bulleted
            </i>
          </div>

          {this.renderMainContent()}
        </div>
      </div>
    );
  }
}

export default withAuth(withLayout(ReadChapter, { noHeader: true }), { loginRequired: false });
