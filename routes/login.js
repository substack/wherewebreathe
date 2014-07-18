var passport = require('passport');
var User = require('../models/account').user;
var NewUser = require('../models/account').newuser;
var nodemailer = require("nodemailer");
var validate = require('./validate');
var authenticateUser = require('./authUser');

function returnTo(res, req, message){
  if (message){msg = message;}
  else if (req.session.msg){msg = req.session.msg}
  else{msg = null;}
  //if session variable has redirect info
  if(req.session.returnTo){
    console.log(req.session.returnTo);
    var msg;
    //have to use redirect instead of render to make sure page variables are sent (cent find a way to access them from req...)// wanted to be able to use message
    res.redirect(req.session.returnTo);
    console.log(req.session.returnTo);
    //clear redirect info
    delete req.session.returnTo
  }
  else{
    res.render('index', { title: 'Home', user : req.user, message: msg});
  }
}
/********************************************************************************************
REGISTRATION AND EMAIL VERIFICAITON
*********************************************************************************************/
exports.register_get = function(req, res) {
      var pageOptions = { title: "Join Where We Breathe", user : req.user, regErr: []};
      res.render('login/register', pageOptions);
};
//add new user to DB
exports.register_post = function(req, res) {
  //server-side validation
  var errorMsgs = [];
  console.log( errorMsgs);
  var txtUsername = req.body.username.trim();
  var txtEmail = req.body.email.trim();
  var txtHID = req.body.HID.trim();
  var txtPass = req.body.password.trim();
 console.log( errorMsgs);
 //check if username is taken
  User.find({username: txtUsername}, function ( err, username){
  var usernameErr = "The username, '"+txtUsername+"', already exists, please try another.";
  var emailErrMsg ="The email, '"+txtEmail+"', is already being used.";
  //check if username is taken
    if (username.length > 0){
      errorMsgs.push(usernameErr);
    }
    //check if email is taken
    User.find({email: txtEmail}, function ( err, email){
    if (email.length > 0){
      errorMsgs.push(emailErrMsg);
      }
      //check if username is taken in unverified accounts table
      NewUser.find({username: txtUsername}, function ( err, newusername){
        if (newusername.length > 0){
          errorMsgs.push(usernameErr);
        }
        //check if email is taken in unverified accounts table
        NewUser.find({email: txtEmail}, function ( err, newemail){
          if (newemail.length > 0){
            //if email exists, return error message
            errorMsgs.push(emailErrMsg);
          }
      
      //check form input again serve-side
      console.log(errorMsgs);
      //username
    if(! /^[A-Za-z0-9_.-@]{3,30}$/.test(txtUsername)){ errorMsgs.push("Your username must be 3 to 30 characters in length and may contain letters, numbers, or . - @ _ characters.")}; 
    //email
    var emailErr = validate.email(txtEmail);
    if(emailErr){
      errorMsgs.push(emailErr)
    }  
    //VIN/HUD
    if(! /(^((?=[^iIoOqQ])\w){17}$)|(^\w{3}[0-9]{6,7}$)/.test(txtHID)){ errorMsgs.push("'"+txtHID+ "' does not look like a VIN or HUD. Please double check your records and try removing spaces.")}; 
    //password
    var passErr = validate.password(txtPass);
    if(passErr){
      errorMsgs.push(passErr)
    };  
    //if any error messages   
    if (errorMsgs.length > 0){
          //there are errors
          var pageOptions = { title: "Join Where We Breathe", user : req.user, regErr: errorMsgs};
          return res.render('login/register', pageOptions);
        }//end if no errors
     else{
      require('crypto').randomBytes(48, function(ex, buf) {
        var token = buf.toString('hex');
        NewUser.register(new NewUser({ 
          username : txtUsername,
          email: txtEmail,
          HID: txtHID,
          token: token 
        }), txtPass, function(err, user) {
          if (err) {
            console.log("user registration error: " +err);
            var pageOptions = { title: "Join Where We Breathe", user : req.user, regErr: [err] };
            return res.render('login/register', pageOptions);
          }
          else{
            //grab returnTo page from cookie

            // this emailing solution is temporary for phase 1 development!!!! nodemailer has better options that require existing emails/domains
            var mailText = "You have one more step before your account with WhereWeBreathe.org is registered. \r\n\r\n";
            mailText += "Please click the link below to verify your email. \r\n\r\n";
            mailText += "http://"+req.headers.host+"/verify/"+token;
            var transport = nodemailer.createTransport("direct", {debug: true});
            var   mailOptions = {
              from: "noreply@wherewebreathe.org",
              to: txtEmail,
              subject: "[TESTING] user verification email",
              text: mailText
            };
            var mail = require("nodemailer").mail;
            mail(mailOptions);
            res.render('login/message', { title: 'Almost done!', user : req.user, message: {text:"An email with an account verification link has been sent to you. Please follow the instructions in the email to complete your account registration", msgType: "alert-success"} });
          }//end else       
        });
      });//end rendomBytes  
     }//end else
             });//end newusers find email
      });//end newusers find username
    });//end email User.find()
  });//end username User.find()
};//end exports.register_post

//verify new users' emails
exports.verify_get =  function(req, res) {
  //remove user from newusers (unverified) table
  NewUser.findOneAndRemove({token: req.params.token}, function ( err, user){
    if (err) {throw err};
    if (user){
      //put user in users (verified) table
      var verified = new User({ 
        username: user.username,
        salt: user.salt, 
        hash: user.hash,
        email: user.email,
        HID: user.HID 
      });
      verified.save(function(err) {
        if (err) {throw err}
        else{
          res.render('login/login', {title: "Login", user : req.user, message:  {text: "Your account registration in now complete. Please login.", msgType: "alert-success" }});
        }
      });      
    }
    else{
      res.render('login/message', { title: 'Oops!', user : req.user, message: {text:"That verification code has expired. If you registered more than a day ago, try registering again, and clicking the verify link that is emailed to you right away.", msgType: "alert-danger"} });
    }
  });
}
/************************************************************************
LOGIN
*************************************************************************/
exports.login_post = function(req, res) {
  //if user doesnt have privacy settings yet, redirect to privacy setting page, first save dafaults
  if(!req.user.visInternet){
  console.log(req.user._id);
    User.findByIdAndUpdate(req.user._id, {visInternet : false, visResearch : false}, function(error, results){
      if(error){throw err}
      else{ 
      //console.log(results);
        req.flash('info', ['It looks like this it the first time you have logged in. Please take a moment to review your privacy settings before continuing on to the rest of the site.', 'alert-warning'])
        res.redirect('/privacy');
      }
    }); //end user.findbyid...    
  }//end if user has privacy settings
  else{
    returnTo(res, req);
  }
};
exports.login_get = function(req, res) {
  var message;
  //used url paramater for error, next phase could use flash message
  if (req.params.msg){
    message = { text: req.params.msg, msgType: req.params.msgType};
  }
  res.render('login/login', { title: 'Login', user : req.user, message: message });
}; 
exports.logout =  function(req, res) {
      req.logout();
      res.send("logged out")
};
/******************************************************************
PASSWORD RECOVERY
******************************************************************/
exports.forgotpass_get =  function(req, res) {
  res.render('login/forgotpass', { title: 'Forgotten Password', user : req.user, message: null });
}
exports.forgotpass_post =  function(req, res) {
  var txtEmail = req.body.email.trim();
  console.log(txtEmail);
  //validate email address
  //email
  var emailErr = validate.email(txtEmail);
  if(emailErr){
    return res.send(400, emailErr);
  }   
  //check if user with email address exists
  User.findOne({email: txtEmail}, function ( error, user){
    if(error){throw error}
    if (!user){
      return res.send(400, "An account with the email, '"+txtEmail+"' isnt currently registered with Where We Breathe.");
    }
    //there is a user but it already has a token set for passReset
    else if(user.passReset){
      return res.send(400, "An email with a password reset link has already been sent to that account.");
    }
    //there is a user with no existing reset token
    else{
     
      require('crypto').randomBytes(48, function(ex, buf) {
        var token = buf.toString('hex');    
        User.findByIdAndUpdate(user._id, {passReset : token}, function(error, results){
          if(error){throw error}
          else{ 
            var mailText = "You have requested to reset your password with Where We Breathe because you have forgotten your password. If you did not request this, please ignore it. It will expire and become useless in 24 hours time.  \r\n";
            mailText += "Please click the link below to finish your registration. \r\n\r\n";
            //req.headers.host includes the port#, req.host will be sans port#
            mailText += "http://"+req.headers.host+"/resetpass/"+user._id+"/"+token;
            var transport = nodemailer.createTransport("direct", {debug: true});
            var   mailOptions = {
              from: "noreply@wherewebreathe.org",
              to: txtEmail,
              subject: "[TESTING] password reset email",
              text: mailText
            };
            var mail = require("nodemailer").mail;
            mail(mailOptions);               
          //success
            return res.send(200); 
          }
        });
      });
      //message check your email for a link to reset your password. 
      //res.render('login/message', { title: 'Please check your email', user : req.user, message: {text:"An email with a link to reset your password has been sent to your email address", msgType: "alert-success"} });
    }
  });
}
exports.resetpass_get =  function(req, res) {
  //either the user has to have a link with :id and :token params, or they need to be logged in
  if (req.params.token && req.params.id){
    //check that token is active and matched id
    User.findOne({passReset: req.params.token, _id: req.params.id}, function(err, results){
    console.log(results)
      var message = null;
      if(!results){
        //if not token or token doesnt align with id
        message = { text: 'That link has expired or is invalid.', msgType: "alert-danger"}
      }
      res.render('login/resetpass', { title: 'Reset Password', user : req.user, id: req.params.id, token:         req.params.token, message: message } );//end res.render  
    });//end user.find()///    
  }//end if params...
  else if(req.user){
    res.render('login/resetpass', { title: 'Change Password', user : req.user, id: null, token: null }); 
  }
  else{
    //send 'em to the login page with a message
    req.session.returnTo = "/resetpass"
    res.render('login/login', { title: 'Login', user : req.user, message: { text: 'You need to login to reset your password OR have a valid password reset link.', msgType: "alert-danger"} });    
  }
}
exports.resetpass_post =  function(req, res) {
  var txtPass = req.body.pass;
  
  //check password
  var passErr = validate.password(txtPass);
  if(passErr){
    return res.send(400, passErr);
  }
    
  var txtId = req.body.id;
  var txtToken = req.body.token;
  //console.log(req.body.id + ":"+ req.body.token);
  //if not logged in, require token, if logged in use id from user to search for a user
  var query;
  if (!req.user){
   if (!txtId || ! txtToken){return res.send(400, "If you arent logged in to your account, you cannot change your password without a valid password reset link (which you can obtain by clicking on the 'forgotten password' link on the login screen.")};
   query = {_id: txtId, passReset: txtToken};
  }
  else{
    query = {_id: req.user.id}
    //console.log("id" + req.user.id);
  }
  //console.log(query);
  User.findOne(query, function(error, user){
    if(error){
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 816)");
    }
    else if(user){
      //create a new user just to get access to the mongoose-passport .setPassword function (couldnt figure out how to implememt mongoose model methods on query results, so this is the slightly convoluted workaround. 
      var tempUser = new User();
      tempUser.setPassword(txtPass, function(err, stuff){
        //remove passReset field, update salt and hash fields from tempUser
        User.findByIdAndUpdate(user.id, {$unset: {passReset: 1 },hash: tempUser.hash, salt: tempUser.salt}, function(err, results){
          if (err) {
            return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 817)");
          }
          //no err, so logout and give ok status to ajax
          req.logout();          
          res.send(200);
        });
      });//end setPassword
    }//end else if
  }); //end find()
}
/**********************************************************************
TEST - remove later
***********************************************************************/
exports.test =  function(req, res) {
      console.log('there');
      res.locals.myVar = 'fjdklfjsdkflsjfkdl';
      res.render('test', { title: 'test', user : req.user, message: null });
      //res.send("x")
      console.log('here');
};
/****************************************************************
PRIVACY
*****************************************************************/

exports.privacy_get = function(req, res) {
  authenticateUser(req, res, function(){ 
  var message = null;
  //for some reason, req.flash clears once accessed
  var temp = req.flash('info');
  if(temp.length > 0){
    console.log(temp[0]);
    message =  {text: temp[0], msgType: temp[1]}
    console.log(message);
  }
    res.render('login/privacy', { 
            title: 'Privacy Settings', 
            user : req.user, 
            message: message
            });
  });//end auth user
}

exports.privacy_post = function(req, res) {
 User.findByIdAndUpdate(req.user._id, {visInternet : req.body.visInternet, visResearch : req.body.visResearch}, function(error, results){
      if(error){
        return res.send(400, "There was an error saving your privacy settings. Please try again.");
      }
      else{ 
      //console.log(results);
        return res.send(200)
      }
  }); //end user.findbyid..
};



