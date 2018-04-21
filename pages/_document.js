import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import JssProvider from 'react-jss/lib/JssProvider';
import getContext from '../lib/context';

class MyDocument extends Document {
  render() {
    return (
      <html
        lang="en"
        style={{
          // fontSize: '62.5%' /* 62.5% of 16px = 10px */,
        }}
      >
        <Head>
          {/* 1. metadata */}

          <meta charSet="utf-8" />
          {/* tells browser that content is UTF-8 encoded */}

          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {/* sets page width to screen width, sets initial zoom */}

          <meta name="google" content="notranslate" />
          {/* tell google to not show translate modals */}

          <meta name="theme-color" content="#1976D2" />
          {/* specifies color of browser on mobile device */}

          {/* 2. static resources (from CDN) */}
          <link
            rel="shortcut icon"
            href="https://storage.googleapis.com/builderbook/favicon32.png"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Muli:300,400:latin"
          />
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
          {/* Next.js requires static files to be located in a static folder,
          so we placed the nprogress.css file into a static folder of our app. */}
          {/* <link rel="stylesheet" type="text/css" href="/static/nprogress.css" /> */}
          {/* It's important to note that we should use the static folder for development only.
          If we plan to deploy our app,
          then we should move all static resources to a content delivery network (CDN). */}
          <link
            rel="stylesheet"
            href="https://storage.googleapis.com/builderbook/nprogress.min.css"
          />
          <link rel="stylesheet" href="https://storage.googleapis.com/builderbook/vs.min.css" />

          {/* 3. global styles */}
          <style>
            {`
              a, a:focus {
                font-weight: 400;
                color: #1565C0;
                text-decoration: none;
                outline: none
              }
              a:hover, button:hover {
                opacity: 0.75;
                cursor: pointer
              }
              blockquote {
                padding: 0 1em;
                color: #555;
                border-left: 0.25em solid #dfe2e5;
              }
              pre {
                display:block;
                overflow-x:auto;
                padding:0.5em;
                background:#FFF;
                color: #000;
                border: 1px solid #ddd;
              }
              code {
                font-size: 14px;
                background: #FFF;
                padding: 3px 5px;
              }
            `}
          </style>
        </Head>
        <body
          style={{
            /* styles for body */
            // font: '16px Muli',
            // font: '16px Roboto',
            // color: '#222',
            margin: '0px auto',
            fontWeight: '300',
            lineHeight: '1.5em',
            // backgroundColor: '#F7F9FC',
          }}
        >
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

// Next.js uses getInitialProps() to populate data to a component's props.
// https://github.com/zeit/next.js#fetching-data-and-component-lifecycle
MyDocument.getInitialProps = ({ renderPage }) => {
  const pageContext = getContext();

  const page = renderPage(Component => props => (
    <JssProvider
      registry={pageContext.sheetsRegistry}
      generateClassName={pageContext.generateClassName}
    >
      <Component pageContext={pageContext} {...props} />
    </JssProvider>
  ));

  return {
    ...page,
    pageContext,
    styles: (
      <style
        id="jss-server-side"
        // eslint-disable-next-line
        dangerouslySetInnerHTML={{
          __html: pageContext.sheetsRegistry.toString(),
        }}
      />
    ),
  };
};

export default MyDocument;
