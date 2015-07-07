var Schema = require('mongoose').Schema;
var db = require('./');
var randomBytes = require('crypto');
var UserPlugin = require('passport-local-mongoose');

var validate = require('./newuser/validate.js');
var mail = require('../lib/mail.js');
var User = require('./user.js');

var schema = new Schema({
  username: String,
  password: String, 
  email: String,
  HID: String, 
  token: String,
  createdAt: {
    type: Date,
    default : Date.now,
    expires: '24h' //expire after 24h seconds 
  }
});
schema.plugin(UserPlugin, { usernameField: 'email' });

schema.methods.sendVerifyEmail = function (params, cb) {
  var verify = 'http://' + params.host + '/verify/' + this.token;
  console.log('sent verify link to ' + this.email + ': ' + verify);
  mail({
    to: this.email,
    subject: "[where we breathe] user verification email",
    text: 'You have one more step before your account with'
      + ' WhereWeBreathe.org is registered. \r\n\r\n'
      + 'Please click the link below to verify your email. \r\n\r\n'
      + verify
  }, cb);
};

schema.methods.resendVerifyEmail = function (params, cb) {
  var verify = 'http://' + params.host + '/verify/' + this.token;
  console.log('resent verify link to ' + this.email + ': ' + verify);
  mail({
    to: this.email,
    subject: "[where we breathe] user verification email (resent)",
    text: "Maybe you didn't get our last confirmation email message?\r\n\r\n"
      + 'You have one more step before your account with'
      + ' WhereWeBreathe.org is registered. \r\n\r\n'
      + 'Please click the link below to verify your email. \r\n\r\n'
      + verify
  }, cb);
};

var NewUser = db.model('newuser', schema);
module.exports = NewUser;

NewUser.create = function (params, cb) {
  validate(params, function (errors) {
    if (errors.length) return cb(errors);
    randomBytes(48, function (err, buf) {
      if (err) return cb([ err ]);
      NewUser.register(new NewUser({
        username: params.username,
        email: params.email,
        HID: params.HID,
        token: buf.toString('hex')
      }), params.password, onuser);
    });
  });
  
  function onuser (err, user) {
    if (err) cb([ err ])
    else cb(null, user)
  }
};

NewUser.verify = function (token, cb) {
  NewUser.findOneAndRemove({ token: token }, function (err, user) {
    if (err) return cb(err);
    if (!user) return cb(new Error(
      'That verification code has expired.'
      + ' If you registered more than a day ago, try registering again,'
      + ' and clicking the verify link that is emailed to you right away.'
    ));
    var verified = new User({
      username: user.username,
      salt: user.salt,
      hash: user.hash,
      email: user.email,
      HID: user.HID,
      firstLogin: true,
      answered: []
    });
    verified.save(cb);
  });
};
