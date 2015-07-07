var User = require('../models/user.js');
var show = require('../lib/show.js');
var returnTo = require('../lib/return_to.js');

exports.post = function (req, res) {
  if (req.headers.referrer) {
    req.session.returnTo = req.headers.referrer;
  }
  User.challenge(req, res, function (err, user) {
    if (err && err.code === 'confirm') {
      res.render('login/confirm', {
        title: 'Confirm your email',
        user: getUsername(req),
        email: req.body.email,
        token: user.token
      });
    }
    else if (err) show.err(req, res, 'Oops!', err);
    else showLogin(user);
  });

  function showLogin (user) {
    //if user doesnt have privacy settings yet, redirect to privacy setting
    // page, first save dafaults
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
    user : getUsername(req),
    message: msg || ''
  });
}; 
