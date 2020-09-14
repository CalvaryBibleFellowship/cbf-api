/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const _findOne = require('sails/lib/hooks/blueprints/actions/findOne');

module.exports = {
  findOne: function(req, res) {
    console.log(req.param('id'), req.me.id);
    if (req.param('id') !== req.me.id && !User.isSuperAdmin(req.me)) {
      return res.forbidden();
    }
    _findOne.apply(this, arguments);
  }
};

