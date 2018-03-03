/**
 * Song.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    number: {type: 'number', required: true},
    title: {type: 'string', required: true},
    lyrics: {type: 'string'},
    openSongLyrics: {type: 'string'}
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
