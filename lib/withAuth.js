// './lib/withAuth.js'

import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

let globalUser = null;

function withAuth(BaseComponent, { loginRequired = true, logoutRequired = false } = {}) {
  class App extends React.Component {
    // Here we specifiyng types of the properties
    static propTypes = {
      user: PropTypes.shape({
        displayName: PropTypes.string,
        email: PropTypes.string.isRequired,
      }),
      isFromServer: PropTypes.bool.isRequired,
    };

    // Specifiyng default properties
    static defaultProps = {
      user: null,
    };

    static async getInitialProps(ctx) {
      const isFromServer = !!ctx.req;
      const user = ctx.req ? ctx.req.user && ctx.req.user.toObject() : globalUser;

      if (isFromServer && user) {
        user._id = user._id.toString();
      }

      const props = { user, isFromServer };

      // Call child component's "getInitialProps", if it is defined
      if (BaseComponent.getInitialProps) {
        Object.assign(props, (await BaseComponent.getInitialProps(ctx)) || {});
      }

      return props;
    }

    componentDidMount() {
      if (this.props.isFromServer) {
        globalUser = this.props.user;
      }

      // If login is required and not logged in, redirect to "/login" page
      if (loginRequired && !logoutRequired && !this.props.user) {
        Router.push('/login');
        return;
      }

      // If logout is required and user logged in, redirect to "/" page
      if (logoutRequired && this.props.user) {
        Router.push('/');
      }
    }

    render() {
      return <BaseComponent {...this.props} />;
    }
  }

  return App;
}

export default withAuth;
