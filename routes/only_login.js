var User = require('../models/user.js');
var NewUser = require('../models/newuser.js');
var show = require('../lib/show.js');
var returnTo = require('../lib/return_to.js');
var passport = require('passport');

var pfn = passport.authenticate('local');
exports.post = function (req, res, next) {
  NewUser.findOne({ email: req.body.email }, onfind);

  function onfind (err, user) {
    if (err) res.render('errors', { errors: err });
    else if (user) res.render('login/confirm', {
      title: 'Confirm your email',
      user: req.user && req.user.username,
      email: req.body.email,
      token: user.token
    });
    else pfn(req, res, onauth);
  }

  function onauth (err) {
    if (err) return res.render('errors', { errors: err });
    var user = req.user;
    if (user.firstLogin) {
      user.update({ $unset: { firstLogin: 1 }, visPublic: false }, onfind);
    }
    else returnTo(res, req)
 
    function onfind (err, results){
      if (err) show.err(req, res, 'Oops!', err);
      // It looks like this it the first time you have logged in.
      // Please take a moment to review your privacy settings before continuing
      // on to the rest of the site.
      res.redirect('/welcome');
    }
  }
};

exports.get = function(req, res) {
  var msg = req.session.message;
  if (msg) delete req.session.message;
  res.render('login/login', {
    title: 'Login',
    user : req.user && req.username || null,
    message: msg || ''
  });
}; 
