var passport = require('passport');
var NewUser = require('../models/newuser.js');
var once = require('once');

module.exports = function (req, res, cb) {
  cb = once(cb);
  NewUser.findOne({ email: req.body.email }, onfind);
  var auth = passport.authenticate('local', onauth);

  function onfind (err, user) {
    if (err) return cb(err);
    if (user) return cb(error('confirm',
      'You need to confirm your email before you can sign in.'
    ));
    auth(req, res, cb);
  }
 
  function onauth (err, user, failure) {
    if (err) cb(err)
    else if (failure) cb(new Error(failure.message))
    else cb(null, user)
  }
};

function error (code, msg) {
  var err = new Error(msg);
  err.code = code;
  return err;
}
