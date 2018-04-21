/**
 * ./pages/public/login.js
 */

import Head from 'next/head';
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';

import withAuth from '../../lib/withAuth';
import withLayout from '../../lib/withLayout';
import notify from '../../lib/notifier';
import { styleLoginButton } from '../../components/SharedStyles';

function Login({ url }) {
  const redirectUrl = (url.query && url.query.redirectUrl) || '';

  return (
    <div style={{ textAlign: 'center', margin: '0 20px' }}>
      <Head>
        <title>Log in to Builder Book</title>
        <meta name="description" content="Login page for builderbook.org" />
      </Head>
      <br />
      <p style={{ margin: '45px auto', fontSize: '44px', fontWeight: '400' }}>Log in</p>
      <p>You’ll be logged in for 14 days unless you log out manually.</p>
      <br />
      {/* Since we will be using Google OAuth for our users,
    both the login and signup buttons redirect a user to the /auth/google route.
    We will tell our server what to do when a user is on the /auth/google route. */}
      <Button
        variant="raised"
        style={styleLoginButton}
        href={`/auth/google?redirectUrl=${redirectUrl}`}
      >
        <img src="https://storage.googleapis.com/nice-future-2156/G.svg" alt="Log in with Google" />
        Log in with Google
      </Button>
      <div>
        <Button variant="raised" onClick={() => notify('success message')}>
          Click me to test notify()
        </Button>
      </div>
    </div>
  );
}

Login.propTypes = {
  url: PropTypes.shape({
    query: PropTypes.shape({
      redirectUrl: PropTypes.string,
    }),
  }).isRequired,
};

// For our Login page, the export code will have logoutRequired: true,
// since logoutRequired is false by default.
export default withAuth(withLayout(Login), { logoutRequired: true });
