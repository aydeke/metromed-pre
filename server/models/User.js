// './server/models/User.js'

import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';

import generateSlug from '../utils/slugify';
import sendEmail from '../aws';
import getEmailTemplate from './EmailTemplate';
import logger from '../logs';

const mongoSchema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  googleToken: {
    access_token: String,
    refresh_token: String,
    token_type: String,
    expiry_date: Number,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  displayName: String,
  avatarUrl: String,

  isGithubConnected: {
    type: Boolean,
    default: false,
  },
  githubAccessToken: {
    type: String,
  },
  purchasedBookIds: [String],
});

class UserClass {
  // The publicFields() method contains
  // user parameters that we call public parameters.
  // We send public parameters to the client (browser).
  static publicFields() {
    return [
      'id',
      'displayName',
      'email',
      'slug',
      'isGithubConnected',
      // To render our app's dashboard,
      // the client needs to know if a user is Admin or not
      'isAdmin',
      // and needs to get the user's Avatar -
      // thus we add isAdmin and avatarUrl to our public parameters.
      'avatarUrl',
      'purchasedBookIds',
    ];
  }

  /** ==========================================================================
   * The main static method signInOrSignUp() for UserClass of our User model.
   * Either logs in an existing user or creates a user document for a new user.
   * ===========================================================================
   * Our signInOrSignUp() method will wait for this.findOne().
   * If a user exists, then the method will wait for this.updateOne()
   * to update the user's tokens.
   * If a user does not exist, our method will wait for generateSlug()
   * and then will wait for this.create().
   */
  static async signInOrSignUp({
    googleId, email, googleToken, displayName, avatarUrl,
  }) {
    // The Mongoose method select() specifies which document parameters to include.
    // https://mongoosejs.com/docs/api.html#query_Query-select
    // We want to include public parameters when we return a user to the client.
    // JavaScript's join() method joins parameters into a string.
    const user = await this.findOne({ googleId }).select(UserClass.publicFields().join(' '));

    // If a user exists, the method finds this exisitng user with this.findOne
    if (user) {
      const modifier = {};

      if (googleToken.accessToken) {
        modifier.access_token = googleToken.accessToken;
      }

      if (googleToken.refreshToken) {
        modifier.refresh_token = googleToken.refreshToken;
      }

      if (_.isEmpty(modifier)) {
        return user;
      }

      // The user exists,
      // update each token inside googleToken with this.updateOne.
      await this.updateOne({ googleId }, { $set: modifier });

      return user;
    }

    // If a user does not exist,
    // our signInOrSignUp() method creates a slug by waiting for generateSlug().
    // The generateSlug() method creates a slug out of the user's displayName.
    const slug = await generateSlug(this, displayName);
    const userCount = await this.find().count();

    // and then creates a new user with this.create.
    const newUser = await this.create({
      createdAt: new Date(),
      googleId,
      email,
      googleToken,
      displayName,
      avatarUrl,
      slug,
      isAdmin: userCount === 0,
    });

    const template = await getEmailTemplate('welcome', {
      userName: displayName,
    });

    try {
      await sendEmail({
        from: `Kelly from Builder Book <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [email],
        subject: template.subject,
        body: template.message,
      });
    } catch (err) {
      logger.error('Email sending error:', err);
    }

    return _.pick(newUser, UserClass.publicFields());
  }
}

mongoSchema.loadClass(UserClass);

const User = mongoose.model('User', mongoSchema);

export default User;
