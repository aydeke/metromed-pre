/**
 * ./lib/api/public.js
 */

import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/public';

/**
 * On the client (lib/api/public.js), an API method getChapterDetail()
 * that calls an API endpoint /get-chapter-detail,
 * passes necessary data to corresponding Express routes.
 * This method takes bookSlug, chapterSlug, headers, and options.
 * Once user is on the /books/:bookSlug/:chapterSlug route, we send request to server.
 * Request has data that we pass to getInitialProps() method via req and query.
 * In turn, getInitialProps passes data to API method getChapterDetail() method.
 */
export const getChapterDetail = ({ bookSlug, chapterSlug }, options = {}) =>
  sendRequest(
    `${BASE_PATH}/get-chapter-detail?bookSlug=${bookSlug}&chapterSlug=${chapterSlug}`,
    Object.assign(
      {
        method: 'GET',
      },
      options,
    ),
  );
