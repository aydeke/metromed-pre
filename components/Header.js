/** ./components/Header.js
 *
 */

import PropTypes from 'prop-types';
import Link from 'next/link';
import Router from 'next/router';
import NProgress from 'nprogress'; // http://ricostacruz.com/nprogress/
import Toolbar from 'material-ui/Toolbar';
import Grid from 'material-ui/Grid';
import Hidden from 'material-ui/Hidden';
import Button from 'material-ui/Button';
import Avatar from 'material-ui/Avatar';

import MenuDrop from './MenuDrop';

import { styleToolbar } from './SharedStyles';

Router.onRouteChangeStart = () => NProgress.start();
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

const optionsMenuCustomer = [
  {
    text: 'My books',
    href: '/customer/my-books',
    as: '/my-books',
  },
  {
    text: 'Log out',
    href: '/logout',
  },
];

const optionsMenuAdmin = [
  {
    text: 'Admin',
    href: '/admin',
  },
  {
    text: 'Log out',
    href: '/logout',
  },
];

const Header = ({ user, hideHeader, redirectUrl }) => (
  <div
    style={{
      overflow: 'hidden',
      position: 'relative',
      display: 'block',
      top: hideHeader ? '-64px' : '0px',
      transition: 'top 0.5s ease-in',
    }}
  >
    <Toolbar style={styleToolbar}>
      <Grid container direction="row" justify="space-around" align="center">
        <Grid item sm={9} xs={8} style={{ textAlign: 'left' }}>
          {!user ? (
            <Link prefetch href="/">
              <a>
                <Avatar
                  src="https://storage.googleapis.com/builderbook/logo.svg"
                  alt="Builder Book logo"
                  style={{ margin: '0px auto 0px 20px', cursor: 'pointer' }}
                />
              </a>
            </Link>
          ) : null}
        </Grid>
        <Grid item sm={2} xs={2} style={{ textAlign: 'right' }}>
          {user && user.isAdmin && !user.isGithubConnected ? (
            <Hidden smDown>
              <a href="/auth/github">
                <Button variant="raised" color="primary">
                  Connect Github
                </Button>
              </a>
            </Hidden>
          ) : null}
        </Grid>
        <Grid item sm={1} xs={2} style={{ textAlign: 'right' }}>
          {user ? (
            <div style={{ whiteSpace: ' nowrap' }}>
              {!user.isAdmin ? (
                <MenuDrop
                  options={optionsMenuCustomer}
                  src={user.avatarUrl}
                  alt={user.displayName}
                />
              ) : null}
              {user.isAdmin ? (
                <MenuDrop options={optionsMenuAdmin} src={user.avatarUrl} alt={user.displayName} />
              ) : null}
            </div>
          ) : (
            <Link
              prefetch
              href={{ pathname: '/public/login', asPath: '/login', query: { redirectUrl } }}
            >
              <a style={{ margin: '0px 20px 0px auto' }}>Log in</a>
            </Link>
          )}
        </Grid>
      </Grid>
    </Toolbar>
  </div>
);

Header.propTypes = {
  user: PropTypes.shape({
    avatarUrl: PropTypes.string,
    displayName: PropTypes.string,
  }),
  hideHeader: PropTypes.bool,
  redirectUrl: PropTypes.string,
};

Header.defaultProps = {
  user: null,
  hideHeader: false,
  redirectUrl: '',
};

export default Header;
