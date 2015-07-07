var NewUser = require('../models/newuser.js');
var getUsername = require('./authUser').getUsername
var show = require('../lib/show.js');

exports.post = function(req, res) {
  NewUser.findOne({ email: req.body.email }, function (err, user) {
    if (err) return show.err(req, res, 'Oops!', err);
    user.resendVerifyEmail({ host: req.headers.host }, onemail);
  });
  
  function onemail (err) {
    if (err) return show.err(req, res, 'Oops!', err);
    show.msg(req, res, 'Where We Breathe',
      'Sent confirmation email to ' + req.body.email
    );
  }
};
