/**
 * is-admin
 *
 * A simple policy that blocks requests from non-admins.
 *
 * For more about how to use policies, see:
 *   https://sailsjs.com/config/policies
 *   https://sailsjs.com/docs/concepts/policies
 *   https://sailsjs.com/docs/concepts/policies/access-control-and-permissions
 */
module.exports = async function (req, res, proceed) {

  if (!req.me) {
    return res.unauthorized();
  }

  if (!User.isAdmin(req.me)) {
    return res.forbidden();
  }

  return proceed();

};
