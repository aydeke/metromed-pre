import generateSlug from '../../../server/utils/slugify';

// MockUser returns a user if the generated slug does match a value
// from the slugs: ['john-jonhson-jr', 'john-jonhson-jr-1', 'john'] array.
const MockUser = {
  // Think of this slugs array as an imitation of MongoDB,
  // our "database" has 3 users with the slugs
  // john-jonhson-jr, john-jonhson-jr-1, and john.
  slugs: ['john-jonhson-jr', 'john-jonhson-jr-1', 'john'],
  findOne({ slug }) {
    if (this.slugs.includes(slug)) {
      return Promise.resolve({ id: 'id' });
    }

    // MockUser returns null if the generated slug does not match any value
    // from the slugs: ['john-jonhson-jr', 'john-jonhson-jr-1', 'john'] array.
    return Promise.resolve(null);
  },
};

// All three tests are inside of the so called
// 'test suite' by using Jest's 'describe(name, fn)' syntax.
describe('slugify', () => {
  /**
   * generateSlug(Model, name) generates the slug
   * john-johnson for a MockUser with the name John Johnson.
   * Since john-johnson does not match any value from the
   * slugs: ['john-jonhson-jr', 'john-jonhson-jr-1', 'john'] array,
   * MockUser returns Promise.resolve(null).
   * This means that in our "database", there is no user with the john-johnson slug.
   * Thus, the following code gets executed inside generateSlug():
   *   if (!user) {
   *     return origSlug;
   *   }
   * If user does not exist, origSlug is indeed original and becomes our user's slug.
   */
  test('no duplication', () => {
    expect.assertions(1);

    return generateSlug(MockUser, 'John Jonhson').then((slug) => {
      expect(slug).toBe('john-jonhson');
    });
  });

  /**
   * Take a look at the one duplication test.
   * Again, this method generates the slug john.
   * Since john does match a value in the
   * slugs: ['john-jonhson-jr', 'john-jonhson-jr-1', 'john'] array,
   * instead of Promise.resolve(null),
   * MockUser returns Promise.resolve({ id: 'id' }).
   * Thus, the following code inside generateSlug() gets executed:
   *   return createUniqueSlug(Model, origSlug, 1);
   * origSlug is not original, so the createUniqueSlug() function
   * adds -1 to the john slug, thereby outputting john-1.
   */
  test('one duplication', () => {
    expect.assertions(1);

    return generateSlug(MockUser, 'John').then((slug) => {
      expect(slug).toBe('john-1');
    });
  });

  /**
   *
   */
  test('multiple duplications', () => {
    expect.assertions(1);

    return generateSlug(MockUser, 'John Jonhson Jr.').then((slug) => {
      expect(slug).toBe('john-jonhson-jr-2');
    });
  });
});
