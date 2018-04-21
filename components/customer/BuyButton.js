/* global StripePublishableKey */

/** ./components/customer/BuyButton.js
 *
 */

// To prevent Eslint from showing warning about undefined global variable:

import React from 'react';
import PropTypes from 'prop-types';
import StripeCheckout from 'react-stripe-checkout';
import NProgress from 'nprogress';

import Button from 'material-ui/Button';

import { buyBook } from '../../lib/api/customer';
import notify from '../../lib/notifier';

const styleBuyButton = {
  margin: '20px 20px 20px 0px',
  font: '14px Muli',
};

class BuyButton extends React.Component {
  static propTypes = {
    book: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
    user: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
    showModal: PropTypes.bool,
  };

  // 1. propTypes and defaultProps
  static defaultProps = {
    book: null,
    user: null,
    showModal: false,
  };

  // 2. constructor (set initial state)
  constructor(props) {
    super(props);

    this.state = {
      showModal: !!props.showModal,
    };
  }

  // 3. onToken function
  /**
   * When a user clicks the BuyButton component, our code calls the onToken function.
   */
  onToken = async (token) => {
    NProgress.start();
    // We pass book prop from the ReadChapter page to the BuyButton component.
    // Thus, constant book is defined as this.props.book.
    // Using ES6 object destructuring:
    const { book } = this.props;
    // After a user clicks the buy button, we want to close the modal
    // (Stripe modal with a form for card details):
    this.setState({ showModal: false });

    try {
      // Then the code calls and waits for successful execution
      // of our API method buyBook() that takes two arguments:
      await buyBook({ stripeToken: token, id: book._id });
      window.location.reload(true);
      notify('Success!');
      NProgress.done();
    } catch (err) {
      NProgress.done();
      notify(err);
    }
  };

  // 4. onLoginClicked function
  /**
   * Why do we need an onLoginClicked function? If a user is logged in,
   * then we simply call the onToken function and buyBook() API method.
   * However, if a user is not logged in,
   * we want to redirect the user to the /auth/google route (Google OAuth).
   */
  onLoginClicked = () => {
    // Similar to the book prop, we pass the user prop
    // from our ReadChapter page to the BuyButton component:
    const { user } = this.props;

    // We check if a user object exists,
    if (!user) {
      // and it if does not exist or is empty,
      // we redirect to Google OAuth:
      const redirectUrl = `${window.location.pathname}?buy=1`;
      window.location.href = `/auth/google?redirectUrl=${redirectUrl}`;
    }
  };

  render() {
    // 5. define variables with props and state
    const { book, user } = this.props;
    const { showModal } = this.state;

    if (!book) {
      return null;
    }

    if (!user) {
      return (
        // 6. Regular button with onClick={this.onLoginClicked} event handler
        // If a user is not logged in, we simply show a button from Material-UI.
        // This button has an onClick event handler that points to {this.onLoginClicked}:
        <div>
          <Button
            variant="raised"
            style={styleBuyButton}
            color="primary"
            onClick={this.onLoginClicked}
          >
            Buy for ${book.price}
          </Button>
        </div>
      );
    }

    console.log(StripePublishableKey);

    return (
      // 7. StripeCheckout button with token and stripeKey parameters
      // If a user is logged in, we again show a button, but now we wrap it with
      // <StripeCheckout>...</StripeCheckout> from the react-stripe-checkout package.
      // https://github.com/azmenak/react-stripe-checkout
      // The StripeCheckout component requires two props: stripeKey and token.
      // Other props are optional,
      // and you are familiar with all of them except desktopShowModal.
      // https://github.com/azmenak/react-stripe-checkout/pull/15
      // This prop controls whether the Stripe modal is open or closed.
      <StripeCheckout
        // stripeKey="pk_test_z3kD4GcZd8ToMa04rTquXVJV"
        stripeKey={StripePublishableKey}
        token={this.onToken}
        name={book.name}
        amount={book.price * 100}
        email={user.email}
        desktopShowModal={showModal || null}
      >
        <Button variant="raised" style={styleBuyButton} color="primary">
          Buy for ${book.price}
        </Button>
      </StripeCheckout>
    );
  }
}

export default BuyButton;
