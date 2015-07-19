exports.err = function (req, res, title, errors) {
  if (!Array.isArray(errors)) errors = [errors];
  res.render('errors', {
    title: title,
    errors: errors
  });
};

exports.msg = function (req, res, title, msg) {
  res.render('message', {
    title: title,
    message: msg
  });
};
