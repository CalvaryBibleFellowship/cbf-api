module.exports = function forbidden(errorMessage = '') {

  var req = this.req;
  var res = this.res;

  sails.log.verbose('Ran custom response: res.forbidden()');

  return res.status(403).send(errorMessage);

};
