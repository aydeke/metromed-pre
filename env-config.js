/** ./env-config.js
 * This file contains universally available environmental variables.
 */

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  StripePublishableKey: dev
    ? process.env.Stripe_Test_PublishableKey
    : process.env.Stripe_Live_PublishableKey,
};
