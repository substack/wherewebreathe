var User = require('../../models/user.js');

module.exports = function (req, res) {
  res.render('admin/home', {
    user: req.user && req.user.username,
    title: 'admin home',
    role: req.user && req.user.role
  });
};
