/**
 * ./lib/withLayout.js
 */

/* eslint-disable */

import React from 'react';
import PropTypes from 'prop-types';
import { MuiThemeProvider } from 'material-ui/styles';
import CssBaseline from 'material-ui/CssBaseline';

import getContext from '../lib/context';
import Header from '../components/Header';
import Notifier from '../components/Notifier';

function withLayout(BaseComponent, { noHeader = false } = {}) {
  class App extends React.Component {
    componentWillMount() {
      this.pageContext = this.props.pageContext || getContext();
    }

    componentDidMount() {
      const jssStyles = document.querySelector('#jss-server-side');
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles);
      }
    }

    render() {
      return (
        <MuiThemeProvider
          theme={this.pageContext.theme}
          sheetsManager={this.pageContext.sheetsManager}
        >
          <CssBaseline />
          <div>
            {/* {console.log(this.props)} */}
            {noHeader ? null : <Header {...this.props} />}
            {/* {noHeader ? null : <Header hideHeader={hideHeader} {...this.props} />} */}
            <BaseComponent {...this.props} />
            <Notifier />
          </div>
        </MuiThemeProvider>
      );
    }
  }

  App.propTypes = {
    pageContext: PropTypes.object, // eslint-disable-line
  };

  App.defaultProps = {
    pageContext: null,
  };

  // getInitialProps() is a static method that passes data to pages by populating the props of a component.
  // Both HOCs and Next.js pages can use this method to get data, but child components cannot.
  // Child components get props from a parent component.
  App.getInitialProps = ctx => {
    if (BaseComponent.getInitialProps) {
      return BaseComponent.getInitialProps(ctx);
    }

    return {};
  };

  return App;
}

export default withLayout;
