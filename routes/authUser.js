//check if user, set page for user to be returned to upon login/registration completion
 var authUser = function(req, res, success){
  if (!req.user){
    req.session.returnTo = req.path;
    req.flash('info', ['You need to log in to do that', 'alert-warning'])
    res.redirect('login');
  }
  else{
    success(req, res);
  }
}
//check if username, if not logged in set username to null
module.exports = {
    authUser: authUser
};
