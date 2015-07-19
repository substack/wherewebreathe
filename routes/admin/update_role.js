var User = require('../../models/user.js');
var show = require('../../lib/show.js');
var isadmin = require('../../lib/isadmin.js');

module.exports = function (req, res) {
  if (!req.user || !isadmin(req.user.role)) {
    return show.err(req, res, 'Not authorized',
      'You are not authorized to perform this action.');
  }
  User.findOne({ username: req.body.name }, function (err, user) {
    if (err) return show.err(req, res, 'Oops', err);
    if (!user) return show.err(req, res, 'Not found',
      'There is no user with that username');
    var role = req.body.role;
    if (!allowed(req.user.role, user.role, role)) {
      return show.err(req, res, 'Not authorized',
        'You are not authorized to perform this action.');
    }
    user.role = role;
    user.save(function (err) {
      if (err) show.err(req, res, 'Oops', err)
      else res.redirect('/admin')
    });
  });
};

function allowed (adminRole, userRole, newRole) {
  if (adminRole === 'su') return true;
  if (adminRole === 'admin' && userRole !== 'su' && (
    role === 'admin' || role === 'facilitator'
    || role === 'user' || role === 'moderated'
  )) return true;
  if (adminRole === 'facilitator' && !isadmin(userRole) (
    role === 'user' || role === 'moderated')
  ) return true;
  return false;
}
