/**
 * ./server/github.js
 */

import qs from 'qs';
import request from 'request';
import GithubAPI from '@octokit/rest';

import User from './models/User';

// This official example provides the following URLs for authorize and token endpoints:
// https://github.com/login/oauth/authorize?scope=user:email&client_id=<%= client_id %>
// https://github.com/login/oauth/access_token
// Let's isolate the non-variable part (part without scope, client_id, etc.) of these URLs
// and point it to variables:
const AUTHORIZE_URI = 'https://github.com/login/oauth/authorize';
const TOKEN_URI = 'https://github.com/login/oauth/access_token';

/**
 * Our Express routes are combined in the setupGithub({ server }) function.
 * Later, this function will be exported and imported to our main server code at server/app.js
 * to initialize Github integration on the server.
 */
export function setupGithub({ server }) {
  const dev = process.env.NODE_ENV !== 'production';

  // The authorize URL contains client_id and request.post requires client_secret,
  // so we have to define both before we use them:
  const CLIENT_ID = dev ? process.env.Github_Test_ClientID : process.env.Github_Live_ClientID;
  const API_KEY = dev ? process.env.Github_Test_SecretKey : process.env.Github_Live_SecretKey;
  console.log(API_KEY);

  // When a user goes to /auth/github,
  // we redirect the user to Github's authorize endpoint (see AUTHORIZE_URI above),
  // where the user is asked to Authorize application.
  server.get('/auth/github', (req, res) => {
    // 1. check if user exists and user is Admin
    if (!req.user || !req.user.isAdmin) {
      // If not, redirect to Login page, return undefined.
      // If the user doesn't exist, let's redirect to the Login page:
      res.redirect('/login');
      // Return undefined with simple return:
      // Unnesessary return statement.
      // return;
    }
    // 2. Redirect to Github's OAuth endpoint (we will qs.stringify() here)
    // Following Github's official example,
    // we need to redirect the user (res.redirect()) to the authorize URL.
    // https://developer.github.com/v3/guides/basics-of-authentication/#accepting-user-authorization
    // However, before redirecting to this URL,
    // we want to generate a full authorize URL
    // by adding some parameters to the basic, non-variable part of the authorize URL
    // (we called it AUTHORIZE_URI, see above).
    // We create a full URL with qs.stringify()
    res.redirect(`${AUTHORIZE_URI}?${qs.stringify({
      // parameters we want to add to AUTHORIZE_URI
      scope: 'repo',
      state: req.session.state,
      client_id: CLIENT_ID,
    })}`);
  });

  // If the user gives permission,
  // Github provides our app with a temporary authorization code value,
  // and the user is redirected to /auth/github/callback.
  // Here, we define the Express route:
  server.get('/auth/github/callback', (req, res) => {
    // 3. check if user exists and user is Admin
    // If not, redirect to Login page, return undefined.
    // (same as 1.)
    if (!req.user || !req.user.isAdmin) {
      res.redirect('/login');
    }

    // 4. return undefined if req.query has error
    // If the response from Github's server contains an error,
    // we redirect the user and return undefined:
    if (req.query.error) {
      res.redirect(`/admin?error=${req.query.error_description}`);
      return;
    }

    const { code } = req.query;

    // Our server sends a POST request with the authorization code to Github's server (at TOKEN_URI)
    // and, in exchange, gets a result that contains either an access_token or error.
    // Since our Express server cannot send a request to Github's server
    // (server to server request instead of server to client response),
    // we use request from the request package (https://www.npmjs.com/package/request)
    // to send a POST request with code (to exchange it for access_token):
    request.post(
      // 5. send request from our server to Github's server.
      // We send request.post by following request's example (we renamed httpResponse to response):
      // request.post({url:'value', form: {key:'value'}}, function(err, r, body){ /* ... */ })
      // This POST request is sent to TOKEN_URI (see above) and contains three parameters:
      // client_id, client_secret, and
      // authorization code (taken from Github's initial response, const { code } = req.query;):
      {
        url: TOKEN_URI,
        // The headers { Accept: 'application/json' } tell Github's server to expect JSON-type data.
        headers: { Accept: 'application/json' },
        form: {
          client_id: CLIENT_ID,
          code,
          client_secret: API_KEY,
        },
      },

      async (err, response, body) => {
        // 6. return undefined if result has error
        // If the response has an error, we will redirect the user and return undefined:
        if (err) {
          res.redirect(`/admin?error=${err.message || err.toString()}`);
        }

        // 7. update User document on database
        // We parse the response's body (which is a JSON string) with JavaScript's JSON.parse().
        // This will produce a JavaScript object.
        // We will point the result variable to this JavaScript object.
        // If the result has an error, we will redirect the user and return undefined:
        const result = JSON.parse(body);

        if (result.error) {
          res.redirect(`/admin?error=${result.error_description}`);
        }

        // If the result has an access_token, then we update the user's document with:
        // isGithubConnected: true, githubAccessToken: result.access_token.
        // result comes back from Github
        // in exchange for our POST request with an authorization code.
        // If this result has an access_token - we save it to the user's document.
        // We'll use this access_token
        // when we need to access the user's data on Github, such as book content.
        // And as you probaby guessed,
        // we'll use User.updateOne() to update our user.
        try {
          await User.updateOne(
            { _id: req.user.id },
            { $set: { isGithubConnected: true, githubAccessToken: result.access_token } },
          );
          res.redirect('/admin');
        } catch (err2) {
          res.redirect(`/admin?error=${err2.message || err2.toString()}`);
        }
      },
    );
  });
}

/**
 * Here we define a getAPI({ accessToken }) function
 * that authenticates the user and sends a request to Github. We will use this function inside:
 * getRepos({ accessToken }) (to get a list of repos),
 * getContent({ accessToken, repoName, path }) (to get content from repo's files) and
 * getCommits({ accessToken, repoName, limit }) (to get a list of commits).
 * We define getAPI({ accessToken }) with the help of GithubAPI from the github package
 * by closely following an official example: https://www.npmjs.com/package/github#example
 */
function getAPI({ accessToken }) {
  const github = new GithubAPI({
    // 8. set parameters for new GithubAPI()
    // Here we follow an example from the docs: https://github.com/octokit/rest.js#options
    // We specify some parameters for a new GithubAPI() instance.
    // timeout is the time for our server to acknowledge a request from Github.
    // If the server does not respond, Github terminates the connection.
    // The max timeout is 10 sec, and here we specify 10 seconds (10000 milliseconds).
    timeout: 10000,
    // host and protocol are self-explanatory.
    host: 'api.github.com', // should be api.github.com for GitHub
    protocol: 'https',
    headers: {
      // application/json in headers informs Github's server that data is in JSON format.
      accept: 'application/json',
    },
    // requestMedia tells Github the data format our server wants to receive.
    // Read more: https://developer.github.com/v3/media
    requestMedia: 'application/json',
  });

  // 9. authenticate user by calling `github.authenticate()`
  // Again, we follow an example from the docs
  // https://www.npmjs.com/package/github#authentication:
  // github.authenticate({
  //   type: 'oauth',
  //   token: process.env.AUTH_TOKEN,
  // });
  // Now we will use the access_token described above.
  // Our server received this token from Github in exchange for the authorization code
  // and saved the token to the user's document as githubAccessToken
  // (see the Express route above for /auth/github/callback).
  // github.authenticate() saves the type of authentication and token into our server's memory
  // and uses them for subsequent API calls.
  // For accessToken we get:
  github.authenticate({
    type: 'oauth',
    token: accessToken,
  });

  return github;
}

export function getRepos({ accessToken }) {
  // 10. function that gets list of repos for user
  // We've already created a new GitHubApi() instance
  // and called github.authenticate() inside getAPI({ accessToken }).
  // The only thing left is to point github to getAPI({ accessToken })
  const github = getAPI({ accessToken });
  // and call github.repos.getAll():
  return github.repos.getAll({ per_page: 100 });
}

export function getContent({ accessToken, repoName, path }) {
  // 11. function that gets repo's content
  // This method gets a repo's content
  // by calling the github.repos.getContent({ owner, repo, path }) API method.
  // As you can see by searching getContent in the docs,
  // this method requires three parameters: owner, repo and path.
  // The fourth parameter ref is optional.
  // https://octokit.github.io/rest.js/#api-Search-repos
  // When we write the static method syncContent() for our Book and Chapter models,
  // we will take owner and repo values from repoName: book.githubRepo.
  // For example, if the repoName is builderbook/book-1,
  // then owner is builderbook and repo is book-1.
  // We reflect that by using ES6's destructuring and JavaScript's split() method:
  // const [owner, repo] = repoName.split('/');
  // Again, we point github to getAPI({ accessToken })
  const github = getAPI({ accessToken });
  const [owner, repo] = repoName.split('/');
  // and call github.repos.getContent({ owner, repo, path }):
  return github.repos.getContent({ owner, repo, path });
  // Note, if the repo's root directory contains files with chapter content,
  // then the path value is '/'.
}

/**
 * The getCommits() method is optional; however it's good practice to have.
 * This method gets a list of repo commits. We take the latest commit and save it to our database.
 * When we sync content between our database and the Github repo -
 * we check if the latest commit id is the same.
 * If it is, then the content in our database is up-to-date.
 * Check up the list of parameters for the repos.getCommits() method:
 *   https://octokit.github.io/rest.js/#api-Search-repos
 * Two required parameters are owner and repo.
 * Again, we take the values of these parameters by splitting repoName:
 * const [owner, repo] = repoName.split('/');
 */
export function getCommits({ accessToken, repoName, limit }) {
  // 12. function that gets list of repo's commits
  // And again, we point github to getAPI({ accessToken })
  const github = getAPI({ accessToken });
  const [owner, repo] = repoName.split('/');
  // and call github.repos.getCommits({ owner, repo, per_page: limit }):
  // We will specify limit: 1 (in the static method for our Book model)
  // to get only the one latest commit.
  // Our static method will save the latest commit's hash to our database as githubLastCommitSha
  // and compare it to Github's value every time the Admin user syncs content between the database
  // and his/her Github repo.
  return github.repos.getCommits({ owner, repo, per_page: limit });
}
