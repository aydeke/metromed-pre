/**
 * ./server/app.js
 */

import express from 'express';
import session from 'express-session';
import mongoSessionStore from 'connect-mongo';
import next from 'next';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import sitemapAndRobots from './sitemapAndRobots';

import logger from './logs';
import auth from './google';
import api from './api';
import routesWithSlug from './routesWithSlug';
import { setupGithub as github } from './github';
import getRootUrl from '../lib/api/getRootUrl';
// import appointment from '../pages/public/appointment';

require('./models/EmailTemplate');

require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const MONGO_URL = process.env.MONGO_URL_TEST;

mongoose.connect(MONGO_URL);

const port = process.env.PORT || 8000;
const ROOT_URL = getRootUrl();

logger.info(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`dev: ${dev}`);
logger.info(`ROOT_URL: ${ROOT_URL}`);

const app = next({ dev });
const handle = app.getRequestHandler();

const URL_MAP = {
  // Tell our Express server to treat /login as /public/login.
  '/login': '/public/login',
  '/my-books': '/customer/my-books',
  '/appointment': '/public/appointment',
  // '/appointment-details': '/public/appointment-details',
};

app.prepare().then(() => {
  // Nextjs app is prepared now.
  const server = express();
  server.use(helmet());

  // Our server has to parse and decode a POST request's body req.body.
  // We need to tell Express to use middleware that parses/decodes application/json format.
  // We do so by using Express's package body-parser.
  // To understand Express's body-parser in more detail, check out this blog post:
  // https://medium.com/@adamzerner/how-bodyparser-works-247897a93b90
  // This line of code returns middlware
  // that parses and decodes json formatted content in req.body.
  server.use(bodyParser.json());

  server.use(bodyParser.urlencoded({ extended: true }));

  const MongoStore = mongoSessionStore(session);

  const sess = {
    name: 'metromed.now.sh',
    secret: '2M/,E^B)}FED5fWU!dKe[wkHD2w.)q*VqRT4/#NK',
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 14 * 24 * 60 * 60, // save session 14 days
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  };

  if (!dev) {
    // To pass information from client to server,
    // we need to make the server trust the proxy server.
    // Builderbook > Chapter 8 > Deploy app > Security > Trust proxy
    server.set('trust proxy', 1);
    // Our app will set cookie only when the client accesses the app via HTTPS protocol.
    // Our app won't set cookie if the client used HTTP.
    // Builderbook > Chapter 8 > Deploy app > Security > cookie.secure
    sess.cookie.secure = true;
  }

  // Make sure that the server.use(session(sess)) line is above auth({ server, ROOT_URL }).
  server.use(session(sess));
  // For a login session to work properly, session(sess) should precede passport.session()
  // (which is part of auth()).
  // Read more in passport's docs: https://www.passportjs.org/docs/configure
  auth({ server, ROOT_URL });
  github({ server });
  api(server);
  // Initialize routes on the server with routesWithSlug({ server, app }):
  routesWithSlug({ server, app });

  sitemapAndRobots({ server });

  // appointment({ server, app });
  server.post('/appointment', (req, res) => {
    console.log(req.body);
    // const { service, day, time, name, phone, email } = req.body;
    app.render(req, res, '/public/appointment-details', req.body);
  });

  server.get('/books/:bookSlug/:chapterSlug', (req, res) => {
    const { bookSlug, chapterSlug } = req.params;
    app.render(req, res, '/public/read-chapter', { bookSlug, chapterSlug });
  });

  // We want our users to see the route
  // /books/:bookSlug/:chapterSlug on their browsers.
  // However, we want our app to render a page
  // that is located at pages/public/read-chapter.js.
  // To make server pass data to /books/:bookSlug/:chapterSlug route,
  // we need to add Express route:
  server.get('*', (req, res) => {
    const url = URL_MAP[req.path];
    if (url) {
      app.render(req, res, url);
    } else {
      handle(req, res);
    }
  });

  // Start Express server.
  server.listen(port, (err) => {
    if (err) throw err;
    // console.log(`> Ready on ${ROOT_URL}`); // eslint-disable-line no-console
    logger.info(`> Ready on ${ROOT_URL}`);
  });
});
