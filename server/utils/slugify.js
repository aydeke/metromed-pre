// './server/utils/slugify.js'

/**
 * The function slugify() performs simple string operations using the
 * JavaScript methods .toString(), .toLowerCase(), .trim(), and .replace.
 * For example, for a user with name: John Johnson,
 * we want the slug to be john-johnson.
 * To learn more about .toString(), .toLowerCase(), .trim(), and .replace,
 * search for them in the Mozilla docs about JavaScript:
 * https://developer.mozilla.org/en-US/search
 */
const slugify = text =>
  text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with -
    .replace(/\s+/g, '-')
    // Replace & with 'and'
    .replace(/&/g, '-and-')
    // Remove all non-word chars
    .replace(/(?!\w)[\x00-\xC0]/g, '-') // eslint-disable-line
    // Replace multiple - with single -
    .trim('-')
    .replace(/\-\-+/g, '-') // eslint-disable-line
    // Remove - from start & end
    .replace(/-$/, '')
    .replace(/^-/, '');

// The function createUniqueSlug() is very similar to generateSlug().
async function createUniqueSlug(Model, slug, count) {
  // At first, it adds a number to slug with ${slug}-${count}.
  const user = await Model.findOne({ slug: `${slug}-${count}` }, 'id');

  // Then, like generateSlug(), it waits for Model.findOne()
  // to find a user with the same slug
  // (in case a user with ${slug}-${count} already exists).

  // If a user does not exist, the function deems ${slug}-${count} unique
  if (!user) {
    // and returns it as an output of generateSlug().
    return `${slug}-${count}`;
  }

  // Else, if a user with the slug value ${slug}-${count} exists,
  // the function increases count by 1 and runs again.
  return createUniqueSlug(Model, slug, count + 1);
}

/** **************************************************************
 * Here is an example of how generateSlug() works.
 * Say a user named Jack Frost signs up on our app.
 * If our database already has a user with the slug jack-frost
 * and does not have a user with slug jack-frost-1,
 * then generateSlug() will return jack-frost-1.
 * If a user with the slug jack-frost-1 already exists,
 * then the function will return jack-frost-2.
 * ----------------------------------------------------------------
 * The generateSlug() method is Model-agnostic and will generate
 * a unique slug for our User, Book, and Chapter models from name.
 * The method will take Model and name as arguments.
 * To ensure that two chapters can have the same slug
 * providing that the chapters belong to two different books,
 * we add one extra argument filter.
 */
export default async function generateSlug(Model, name, filter = {}) {
  // Before our method generates a unique slug,
  // we make a slug from name without checking for uniqueness.
  // Convert name into slug using slugify() defined at the top of the file.
  const origSlug = slugify(name);

  // Wait for Model.findOne() to find if a user with the same slug already exists.
  const user = await Model.findOne(Object.assign({ slug: origSlug }, filter), 'id');

  // If a user with the same slug does not exist,
  if (!user) {
    // then deem this slug original
    // and return it as an output of generateSlug().
    return origSlug;
  }

  // If a user with the same slug does exist,
  // call the createUniqueSlug() function
  // that appends slug with a number to make it unique.
  return createUniqueSlug(Model, origSlug, 1);
}
