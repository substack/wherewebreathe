var Schema = require('mongoose').Schema;
var once = require('once');
var UserPlugin = require('passport-local-mongoose');
var db = require('./');

var UserSchema = new Schema({
  //'_id' used as userID for linking to other tables, autogenerated by DB
  //password registered from newusers table stored as salt and hash
  username: String,
  salt: String,
  hash: String, 
  email: String,
  HID: String, 
  firstLogin: Boolean,
  visPublic: Boolean,
  passReset: String,
  answered: Array
});
UserSchema.plugin(UserPlugin, { usernameField: 'email' });

var User = db.model('user', UserSchema);
module.exports = User;
