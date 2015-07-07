module.exports = function returnTo (res, req, message) {
  var msg = message || req.session.msg || null;
 
  if (req.session.returnTo){
    res.redirect(req.session.returnTo);
    delete req.session.returnTo
  }
  else {
    res.render('index', {
      title: 'Home',
      user: req.user && req.username || null,
      message: msg
    });
  }
};
