/**
 * ./pages/index.js
 */

import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Link from 'next/link';

import Button from 'material-ui/Button';

// import withAuth from '../lib/withAuth';
import withLayout from '../lib/withLayout';
import notify from '../lib/notifier';

class Index extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      displayName: PropTypes.string,
      email: PropTypes.string.isRequired,
    }),
  };

  static defaultProps = {
    user: null,
  };

  componentDidMount() {
    console.log('Index page component did mount.'); // eslint-disable-line no-console
  }

  render() {
    const { user } = this.props;
    // console.log(user); // eslint-disable-line no-console
    return (
      <div style={{ padding: '10px 45px' }}>
        <Head>
          <title>Dashboard</title>
          <meta name="description" content="List of purchased books." />
        </Head>
        <h1>Index page</h1>
        {/* <p>Email: {user.email}</p> */}
        {/* <Button variant="raised" onClick={() => notify('success message')}>
          Click me to test notify()
        </Button> */}
        <Link href="/appointment">
          <a>
            <Button variant="raised">Request Appointment</Button>
          </a>
        </Link>
        <h2>link What is Lorem Ipsum?</h2>
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
          been the industry's standard dummy text ever since the 1500s, when an unknown printer took
          a galley of type and scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting, remaining essentially
          unchanged. It was popularised in the 1960s with the release of Letraset sheets containing
          Lorem Ipsum passages, and more recently with desktop publishing software like Aldus
          PageMaker including versions of Lorem Ipsum.
        </p>
      </div>
    );
  }
}

// We calling withLayout with Index as an argiment.
// Then calling withAuth with return value from withLayout as an argument.
// Then exporting the return value of withAuth.
// export default withAuth(withLayout(Index));
export default withLayout(Index);
