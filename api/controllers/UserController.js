/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const util = require("util");
const _ = require("@sailshq/lodash");
const formatUsageError = require("sails/lib/hooks/blueprints/formatUsageError");
const _findOne = require("sails/lib/hooks/blueprints/actions/findOne");
const EmailService = require("../services/EmailService");

module.exports = {
  findOne(req, res) {
    if (req.param("id") !== req.me.id && !User.isSuperAdmin(req.me)) {
      return res.forbidden();
    }
    _findOne.apply(this, arguments);
  },

  update(req, res) {
    var parseBlueprintOptions = req.options.parseBlueprintOptions || req._sails.config.blueprints.parseBlueprintOptions;

    // Set the blueprint action for parseBlueprintOptions.
    req.options.blueprintAction = "update";

    var queryOptions = parseBlueprintOptions(req);
    var Model = req._sails.models[queryOptions.using];

    var criteria = {};
    criteria[Model.primaryKey] = queryOptions.criteria.where[Model.primaryKey];

    // Find and update the targeted record.
    //
    // (Note: this could be achieved in a single query, but a separate `findOne`
    //  is used first to provide a better experience for front-end developers
    //  integrating with the blueprint API.)
    var query = Model.findOne(_.cloneDeep(criteria), _.cloneDeep(queryOptions.populates));
    query.exec(function found(err, matchingRecord) {
      if (err) {
        switch (err.name) {
          case "UsageError":
            return res.badRequest(formatUsageError(err, req));
          default:
            return res.serverError(err);
        }
      } //-•

      if (!matchingRecord) {
        return res.notFound();
      }

      Model.update(_.cloneDeep(criteria), queryOptions.valuesToSet)
        .meta(queryOptions.meta)
        .exec(async function updated(err, records) {
          // Differentiate between waterline-originated validation errors
          // and serious underlying issues. Respond with badRequest if a
          // validation error is encountered, w/ validation info, or if a
          // uniqueness constraint is violated.
          if (err) {
            switch (err.name) {
              case "AdapterError":
                switch (err.code) {
                  case "E_UNIQUE":
                    return res.badRequest(err);
                  default:
                    return res.serverError(err);
                } //•
              case "UsageError":
                return res.badRequest(formatUsageError(err, req));
              default:
                return res.serverError(err);
            }
          } //-•

          // If we didn't fetch the updated instance, just return 'OK'.
          if (!records) {
            return res.ok();
          }

          if (!_.isArray(records)) {
            return res.serverError(
              "Consistency violation: When `fetch: true` is used, the second argument of the callback from update should always be an array-- but for some reason, it was not!  This should never happen... it could be due to a bug or partially implemented feature in the database adapter, or some other unexpected circumstance."
            );
          }

          // Because this should only update a single record and update
          // returns an array, just use the first item.  If more than one
          // record was returned, something is amiss.
          if (!records.length || records.length > 1) {
            req._sails.log.warn(util.format("Unexpected output from `%s.update`.", Model.globalId));
          }

          var updatedRecord = records[0];

          if (matchingRecord.enabled !== updatedRecord.enabled) {
            EmailService.addToQueue({
              to: updatedRecord.emailAddress,
              subject: updatedRecord.enabled ? "Welcome to CBF!" : "Sorry to see you go!",
              template: "email-access-changed",
              layout: "layout-notification-email",
              templateData: {
                fullName: updatedRecord.fullName,
                user: updatedRecord,
              },
            });
          }

          // Do a final query to populate the associations of the record.
          //
          // (Note: again, this extra query could be eliminated, but it is
          //  included by default to provide a better interface for integrating
          //  front-end developers.)
          var Q = Model.findOne(_.cloneDeep(criteria), _.cloneDeep(queryOptions.populates));
          Q.exec(function foundAgain(err, populatedRecord) {
            if (err) {
              return res.serverError(err);
            }
            if (!populatedRecord) {
              return res.serverError("Could not find record after updating!");
            }
            res.ok(populatedRecord);
          }); // </foundAgain>
        }); // </updated>
    }); // </found>
  },
};
