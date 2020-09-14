/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

  '*': 'is-logged-in',
  'user/find': 'is-super-admin',
  'user/create': 'is-super-admin',
  'user/update': 'is-super-admin',
  'user/destroy': 'is-super-admin',

  // Bypass the `is-logged-in` policy for:
  'entrance/*': true,
  'account/logout': true,
  'view-homepage-or-redirect': true,
  'deliver-contact-form-message': true,
  'song/find': true,
  'sermon/find': true,
  'sermon/sync': true
};
