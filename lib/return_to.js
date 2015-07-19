var url = require('url');

module.exports = function returnTo (res, req, message) {
  var msg = message || req.session.msg || null;
  var ref = req.headers.referer;
  var uref = ref && url.parse(ref);
 
  if (req.session.returnTo){
    res.redirect(req.session.returnTo);
    delete req.session.returnTo
  }
  else if (uref && uref.path !== '/login'
  && uref.host === req.headers.host) {
    res.redirect(uref.path);
  }
  else {
    res.render('index', {
      title: 'Home',
      user: req.user && req.username || null,
      message: msg
    });
  }
};
