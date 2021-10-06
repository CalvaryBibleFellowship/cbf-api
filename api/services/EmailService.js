const _ = require("@sailshq/lodash");

const queue = [];

const EmailService = {
  addToQueue(emailConfig) {
    queue.push(emailConfig);
    this.processQueue();
  },

  processQueue: _.debounce(async () => {
    sails.log.info("Processing email queue");
    let emailConfig = queue.shift();
    while (emailConfig) {
      sails.log.info(
        "Sending email",
        _.pick(emailConfig, ["to", "subject", "template"])
      );
      try {
        await sails.helpers.sendTemplateEmail.with(emailConfig);
      } catch (err) {
        sails.log.error("Error while sending email", err);
      }
      emailConfig = queue.shift();
    }
  }, 5000),
};

module.exports = EmailService;
