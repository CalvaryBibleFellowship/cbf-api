const jwt = require('jsonwebtoken');

module.exports = {


  friendlyName: 'Login',


  description: 'Log in using the provided email and password combination.',


  extendedDescription:
`This action attempts to look up the user record in the database with the
specified email address.  Then, if such a user exists, it uses
bcrypt to compare the hashed password from the database with the provided
password attempt.`,


  inputs: {

    emailAddress: {
      description: 'The email to try in this attempt, e.g. "irl@example.com".',
      type: 'string',
      required: true
    },

    password: {
      description: 'The unencrypted password to try in this attempt, e.g. "passwordlol".',
      type: 'string',
      required: true
    },

    rememberMe: {
      description: 'Whether to extend the lifetime of the user\'s session.',
      extendedDescription:
`Note that this is NOT SUPPORTED when using virtual requests (e.g. sending
requests over WebSockets instead of HTTP).`,
      type: 'boolean'
    }

  },


  exits: {

    success: {
      description: 'The requesting user agent has been successfully logged in.',
      extendedDescription:
`Under the covers, this stores the id of the logged-in user in the session
as the \`userId\` key.  The next time this user agent sends a request, assuming
it includes a cookie (like a web browser), Sails will automatically make this
user id available as req.session.userId in the corresponding action.  (Also note
that, thanks to the included "custom" hook, when a relevant request is received
from a logged-in user, that user's entire record from the database will be fetched
and exposed as \`req.me\`.)`
    },

    badCombo: {
      description: `The provided email and password combination does not
      match any user in the database.`,
      responseType: 'unauthorized'
      // ^This uses the custom `unauthorized` response located in `api/responses/unauthorized.js`.
      // To customize the generic "unauthorized" response across this entire app, change that file
      // (see http://sailsjs.com/anatomy/api/responses/unauthorized-js).
      //
      // To customize the response for _only this_ action, replace `responseType` with
      // something else.  For example, you might set `statusCode: 498` and change the
      // implementation below accordingly (see http://sailsjs.com/docs/concepts/controllers).
    },

    unconfirmed: {
      description: "User has not verified his email and so cannot access the API",
      responseType: 'forbidden'
    },

    notEnabled: {
      description: "User has not been enabled by a CBF Admin",
      responseType: 'forbidden'
    }

  },


  fn: async function(inputs, exits) {
    const userRecord = await User.findOne({
      emailAddress: inputs.emailAddress.toLowerCase(),
    });

    // If there was no matching user, respond thru the "badCombo" exit.
    if (!userRecord) {
      throw 'badCombo';
    }

    // If the password doesn't match, then also exit thru "badCombo".
    await sails.helpers.passwords.checkPassword(inputs.password, userRecord.password)
      .intercept('incorrect', 'badCombo');

    if (userRecord.emailStatus === "unconfirmed") {
      throw { unconfirmed: "Looks like you haven't verified your email address. Please check your inbox." };
    }

    if (!userRecord.enabled) {
      throw { notEnabled: "Looks like you haven't been granted access by an admin. Please contact one of our elders or deacons." };
    }

    const { accessTokenSecret, accessTokenDefaultTTL, accessTokenRememberMeTTL } = sails.config.custom;
    const tokenTTL = inputs.rememberMe ? accessTokenRememberMeTTL : accessTokenDefaultTTL;
    jwt.sign({ userId: userRecord.id }, accessTokenSecret, { expiresIn: tokenTTL }, function(err, token) {
      if (err) throw err;
      const userAttrs = userRecord.toJSON();
      exits.success({ ...userAttrs, token });
    });
  }

};
