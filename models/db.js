var mongoose = require('mongoose');
mongoose.set('debug', false);
var userDB = mongoose.connect('mongodb://localhost/wherewebreathe');
//var userDB = mongoose.connect('mongodb://localhost/wherewebreathe');

var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  //'_id' used as userID for linking to other tables, autogenerated by DB
  //password registered from newusers table stored as salt and hash
    username: String,
    salt: String,
    hash: String, 
    email: String,
    HID: String, 
    firstLogin: Boolean,
    visPublic: Boolean,
    passReset: String,
    answered: Array
});

var NewUser = new Schema({
    username: String,
    password: String, 
    email: String,
    HID: String, 
    token: String,
    createdAt: { type: Date, default : Date.now, expires: '24h' }//expire after 15 seconds 
});
User.plugin(passportLocalMongoose, {usernameField: "email"});

User.methods.resetPassword = function resetPassword(id, cb){
  //this.model('User').find({_id: id}, function(err, data){
   cb("data");
  //})
 
};
NewUser.plugin(passportLocalMongoose, {usernameField: "email"});

var AnswerSchema = new Schema({
  qid: Schema.Types.ObjectId,
  uid: Schema.Types.ObjectId,
  a: String
  
}); 
var QuestionSchema = new Schema({
  order: Number,
  qType: String,
  label: String,
  answers: Array,
  question: String, 
  validation: String,
  valMsg: String, 
  placeholder: String,
  qSet: String
});

//module.exports = userDB.model('Account', Account);

module.exports = {
    user: userDB.model('user', User),
    newuser: userDB.model('newuser', NewUser),
    answer: userDB.model('answer', AnswerSchema),
    question: userDB.model('question', QuestionSchema)
};

