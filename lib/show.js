exports.err = function (req, res, title, errors) {
  if (!Array.isArray(errors)) errors = [errors];
  res.render('errors', {
    title: title,
    user: req.user && req.user.username || null,
    errors: errors
  });
};

exports.msg = function (req, res, title, msg) {
  res.render('message', {
    title: title,
    user: req.user && req.user.username || null,
    message: msg
  });
};
