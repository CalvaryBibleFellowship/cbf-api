/**
 * Song.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    number: {type: 'number'},
    title: {type: 'string', required: true},
    key: {type: 'string'},
    lyrics: {type: 'string'},
    ccli: {type: 'string'},
  },

  afterCreate(record, cb) {
    UpdateService.refreshUpdatedAt('songs', cb);
  },

  afterUpdate(record, cb) {
    UpdateService.refreshUpdatedAt('songs', cb);
  },

  beforeDestroy(record, cb) {
    UpdateService.refreshUpdatedAt('songs', cb);
  }
};

