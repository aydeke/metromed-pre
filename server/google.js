/**
 * ./server/google.js
 */

import passport from 'passport';
import { OAuth2Strategy as Strategy } from 'passport-google-oauth';

import User from './models/User';

export default function auth({ ROOT_URL, server }) {
  // 1. define `verify` function: get profile and googleToken from Google AND
  // The function verify() receives profile and googleToken from Gooogle's response.
  // Passport requires a verify function to have a verified() callback
  // (function that is an argument of another function).
  // Remember that we will call and wait for User.signInOrSignUp(),
  // thus we use async/await syntax.
  const verify = async (accessToken, refreshToken, profile, verified) => {
    let email;
    let avatarUrl;

    // From profile, we get the following data:
    // googleId (profile.id)
    // email (profile.emails[0].value)
    // displayName (profile.displayName)
    // avatarUrl (profile.image.url)

    // profile.emails is an array, so we will take the first email from it:
    if (profile.emails) {
      email = profile.emails[0].value;
    }

    if (profile.image && profile.image.url) {
      // We specify the profile image size
      // by appending ?sz=128 instead of ?sz=50 to profile.image.url:
      avatarUrl = profile.image.url.replace('sz=50', 'sz=128');
    }
    // This snippet is from 3-end
    if (profile.photos && profile.photos.length > 0) {
      avatarUrl = profile.photos[0].value.replace('sz=50', 'sz=128');
    }

    // We need to catch an error in case there is one.
    // Thus we use try/catch in combination with async/await.
    try {
      // Since we wait for User.signInOrSignUp() to return user,
      // we need to pass all data we received from Google to User.signInOrSignUp():
      const user = await User.signInOrSignUp({
        googleId: profile.id,
        email,
        googleToken: { accessToken, refreshToken },
        displayName: profile.displayName,
        avatarUrl,
      });
      // The callback verified() has the following arguments: verified(err, user, info).
      // in case of success, we return null for error and user: verified(null, user)
      verified(null, user);
    } catch (err) {
      // in case of error, we return null for user and err: verified(err, null)
      verified(err);
      console.log(err); // eslint-disable-line
    }
  };

  passport.use(new Strategy(
    // 2. call and wait for static method `signInOrSignUp` to return user
    {
      clientID: process.env.Google_clientID,
      clientSecret: process.env.Google_clientSecret,
      // callbackURL: `${ROOT_URL}/auth/google/callback`,
      callbackURL: `${ROOT_URL}/oauth2callback`,
    },
    verify,
  ));

  // 3. serialize user AND
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // deserialize user;
  passport.deserializeUser((id, done) => {
    User.findById(id, User.publicFields(), (err, user) => {
      done(err, user);
    });
  });

  // 4. initial passport AND
  server.use(passport.initialize());
  // save session to keep user logged in (via browser cookie);
  server.use(passport.session());

  /**
   * ================================================================================
   * Express routes
   */

  server.get('/auth/google', (req, res, redirectUrl) => {
    if (req.query && req.query.redirectUrl && req.query.redirectUrl.startsWith('/')) {
      req.session.finalUrl = req.query.redirectUrl;
    } else {
      req.session.finalUrl = null;
    }

    passport.authenticate('google', {
      // 1. options such as scope and prompt
      scope: ['profile', 'email'],
      prompt: 'select_account',
    })(req, res, redirectUrl);
  });

  server.get(
    '/oauth2callback',
    passport.authenticate('google', {
      failureRedirect: '/login',
    }),
    (req, res) => {
      // 2. if successful, redirect user to Index page ('/')
      // Passport makes the user object available at req.user.
      // We use req.user.isAdmin to check if a user is Admin:
      if (req.user && req.user.isAdmin) {
        res.redirect('/admin');
      } else if (req.session.finalUrl) {
        res.redirect(req.session.finalUrl);
      } else {
        res.redirect('/my-books');
      }
    },
  );

  server.get('/logout', (req, res) => {
    // 3. remove 'req.user' property and user id from session,
    req.logout();
    // redirect to Login page ('/login')
    res.redirect('/login');
  });
}
