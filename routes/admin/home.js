var User = require('../../models/user.js');
var show = require('../../lib/show.js');
var isadmin = require('../../lib/isadmin.js');

var rings = {
  su: 3,
  admin: 2,
  facilitator: 1
}; 

module.exports = function (req, res) {
  if (!req.user) {
    return show.err(req, res, 'Please log in.',
      'You must authenticate to view this page.');
  }
  if (!isadmin(req.user.role)) {
    return show.err(req, res, 'Not authorized',
      'You are not authorized to view this page.');
  }
  var adminRoles = [ 'su', 'admin', 'facilitator' ];
  User.find({ role: { $in: adminRoles } }, function (err, users) {
    if (err) return show.error(req, res, 'Oops', err);
    render(users);
  });
 
  function render (adminUsers) {
    res.render('admin/home', {
      user: req.user,
      title: 'admin dashboard',
      role: req.user.role,
      ring: rings[req.user.role],
      rings: rings,
      adminUsers: adminUsers
    });
  }
};
