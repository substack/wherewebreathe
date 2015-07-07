var NewUser = require('../models/newuser.js');
var show = require('../lib/show.js');

// verify new users' emails
exports.get =  function(req, res) {
  NewUser.verify(req.params.token, function (err, user) {
    if (err) return show.err(req, res, 'Oops!', err);
    show.msg(req, res, 'registration complete',
      'Your account registration is now complete. Please login.');
  });
}
