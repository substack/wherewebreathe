var passport = require('passport');
var User = require('../models/user.js');
var NewUser = require('../models/newuser.js');
var PassReset = require('../models/pass_reset.js');
var nodemailer = require("nodemailer");

var authenticateUser = require('./authUser').authUser;
var generateUnanswered = require('../lib/generate_unanswered.js');
var returnTo = require('../lib/return_to.js');

var mail = require('../lib/mail.js');
var validate = require('../lib/validate.js');
var randomBytes = require('crypto').randomBytes;

function checkCommonName(username){
  var commonnames = require('./common-names')
  var username = username.toLowerCase();
  var containsCommon = false;
  var name;

  for (i in commonnames){
  //console.log(username.indexOf(commonnames[i]));
    if (username.indexOf(commonnames[i])>-1) { 
      console.log(commonnames[i])
      containsCommon = true;
      name = commonnames[i]
      break 
    }
  }
  if(containsCommon){
  return "Your username contains the text, '"+name+"'. Please choose another username that does not contain a common name. (this is an extra step to maintain your anonymity)"
  }else{
    return "ok"
  }
}
/********************************************************************************************
REGISTRATION, EMAIL VERIFICAITON, checkUsername
*********************************************************************************************/
exports.checkUsername =  function(req, res){
  var status = checkCommonName(req.query.username);
  res.send(200, status)
}
exports.getRandomUsername =  function(req, res){
  //generate random username
  //check that not already taken
  //check that not a common name
  var Chance = require('chance');
  // Instantiate Chance so it can be used
  var chance = new Chance();
  getName()
  function getName(){
    var candidateName = chance.word({syllables: 3})
    console.log(candidateName);
    console.log(checkCommonName(candidateName) );
    if (checkCommonName(candidateName) != 'ok'){
      getName();
    }else{
      res.send(200,candidateName)
    }
    
  }
}

exports.logout =  function(req, res) {
      req.logout();
      res.send("logged out")
};
/******************************************************************
PASSWORD RECOVERY
******************************************************************/
exports.forgotpass_get =  function(req, res) {
  res.render('login/forgotpass', { title: 'Forgotten Password', message: null });
}
exports.forgotpass_post =  function(req, res) {
  var txtEmail = req.body.email.trim();
  //console.log(txtEmail);
  //validate email address
  //email
  var emailErr = validate.email(txtEmail);
  if(emailErr){
    return res.send(400, emailErr);User
  }   
  //check if user with email address exists
  User.findOne({email: txtEmail}, function ( error, user){
    if(error){throw error}
    PassReset.findOne({uid: user._id}, function ( error2, passResetResults){
      if(error2){throw error}
      if (!user){
        return res.send(400, "An account with the email, '"+txtEmail+"' isnt currently registered with Where We Breathe.");
      }
      //there is a user but it already has a token set for passReset
      else if(passResetResults){
        return res.send(400, "An email with a password reset link has already been sent to that account.");
      }
      
      //there is a user with no existing reset token
      else{
       
        require('crypto').randomBytes(48, function(ex, buf) {
          var token = buf.toString('hex'); 
          var reset = new PassReset({
            uid: user._id,
            passReset : token
          })   
          reset.save( function(error, results, noAffected){
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
            //successUser
              return res.send(200); 
            }
          });
        });
        //message check your email for a link to reset your password. 
        //res.render('login/message', { title: 'Please check your email', message: {text:"An email with a link to reset your password has been sent to your email address", msgType: "alert-success"} });
      }
    });//end passREsetFind
  });
}
exports.resetpass_get =  function(req, res) {
  //either the user has to have a link with :id and :token params, or they need to be logged in
  if (req.params.token && req.params.id){
    //check that token is active and matched id
    PassReset.findOne({passReset: req.params.token, uid: req.params.id}, function(err, results){
    //console.log(results)
      var message = null;
      if(!results){
        //if not token or token doesnt align with id
        message = { text: 'That link has expired or is invalid.', msgType: "alert-danger"}
      }
      res.render('login/resetpass', { title: 'Reset Password', id: req.params.id, token: req.params.token, message: message } );//end res.render  
    });//end user.find()///    
  }//end if params...
  else if(req.user){
    res.render('login/resetpass', { title: 'Change Password', id: null, token: null }); 
  }
  else{
    //send 'em to the login page with a message
    req.session.returnTo = "/resetpass"
    res.render('login/login', { title: 'Login', message: { text: 'You need to login to reset your password OR have a valid password reset link.', msgType: "alert-danger"} });    
  }
}
exports.resetpass_post =  function(req, res) {
  var txtPass = req.body.pass;
  //check password
  var passErr = validate.password(txtPass);
  if(passErr){
    return res.send(400, passErr);
  }
  var userID = req.body.id;
  var txtToken = req.body.token;
  //console.log(req.body.id + ":"+ req.body.token);
  //if not logged in, require token, if logged in use id from user to search for a user
  var query;
  if (!req.user){
  console.log("not logged in");
    if (!userID || ! txtToken){return res.send(400, "If you arent logged in to your account, you cannot change your password without a valid password reset link (which you can obtain by clicking on the 'forgotten password' link on the login screen.")};
   query = {uid: userID, passReset: txtToken};
  }
  else{
  console.log("not logged in");
    query = {uid: req.user.id}
    userID = req.user.id
    //console.log("id" + req.user.id);
  }
  //console.log(query);
  PassReset.findOneAndRemove(query, function(error, user){
    if(error){
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 816)");
    }
    //user will return null if this is password change vs a pass reset....
    //else if(user){
      //create a new user just to get access to the mongoose-passport .setPassword function (couldnt figure out how to implememt mongoose model methods on query results, so this is the slightly convoluted workaround. 
      var tempUser = new User();
      tempUser.setPassword(txtPass, function(err, stuff){
        //remove passReset field, update salt and hash fields from tempUser
        User.findByIdAndUpdate(userID, {hash: tempUser.hash, salt: tempUser.salt}, function(err, results){
          if (err) {
            return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 817)");
          }
          console.log(results)
          //no err, so logout and give ok status to ajax
          req.logout();          
          res.send(200);
        });
      });//end setPassword
    //}//end else if
  }); //end find()
}

/****************************************************************
PRIVACY
*****************************************************************/

exports.privacy_get = function(req, res) {
  authenticateUser(req, res, function(){ 
  var message = null;
  //for some reason, req.flash clears once accessed
  var temp = req.flash('info');
  if(temp.length > 0){
    message =  {text: temp[0], msgType: temp[1]}
  }
 var visPublic
 //get user privacy setting from db if they exist
 User.findOne({_id: req.user._id}, function (err, result) {
  if (err){
    req.logout();
    return res.render('login/login', {title: "Login", message:  {text: "Something went wrong on our side of things. Please try logging in again to edit your privacy settings. (Error ID: 818)", msgType: "alert-success" }});
  } //end if err
  res.render('login/privacy', { 
            title: 'Privacy Settings', 
            message: message, 
            visPublic: result.visPublic
            }); 
  }); //end find one 
    
  });//end auth user
}

exports.privacy_post = function(req, res) {
 User.findByIdAndUpdate(req.user._id, {visPublic : req.body.visPublic}, function(error, results){
      if(error){
        return res.send(400, "There was an error saving your privacy settings. Please try again. (Error ID: 819)");
      }
      console.log(results)
      if(results.length<=0){
        return res.send(400, "There was an error saving your privacy settings. Please try again. (Error ID: 820)");
      }      
      else{ 
        return res.send(200)
      }
  }); //end user.findbyid..
};
