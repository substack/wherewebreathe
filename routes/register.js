var NewUser = require('../models/newuser.js');
var show = require('../lib/show.js');

exports.get = function(req, res) {
  res.render('login/register', {
    title: 'Join Where We Breathe',
    user: req.user
  });
};

exports.post = function(req, res) {
  NewUser.create(req.body, function (errors, user) {
    if (errors.length) return show.err(req, res, 'registration error', errors);
    user.sendVerifyEmail({ host: req.headers.host }, onemail);

    function onemail (err) {
      if (err) return show.err(req, res, 'email delivery failure', err);
      res.render('login/register-success', {
        title: 'Where We Breathe',
        user: req.user,
        email: user.email
      });
    }
  });
};
