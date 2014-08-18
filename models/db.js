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

var PassReset = new Schema({ 
    passReset: String,
    uid: Schema.Types.ObjectId,
    createdAt: { type: Date, default : Date.now, expires: '24h' }//expire after 24h seconds 
});

var NewUser = new Schema({
    username: String,
    password: String, 
    email: String,
    HID: String, 
    token: String,
    createdAt: { type: Date, default : Date.now, expires: '24h' }//expire after 24h seconds 
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
  order: Number,//the order questions are asked in (conditional questions dont get ordered and start at 100x)
  qType: String,//dropdown, radio, text
  label: String,//question helper label, not totally necessary?
  answers: Array,// can be dropdown answers
  question: String, //questioon text
  validation: String,//validation pattern
  valMsg: String, //validation warning text
  placeholder: String,//placeholder for text input
  qSet: String,//question set
  autocomplete: Array// array of suggested answers
});

//module.exports = userDB.model('Account', Account);

module.exports = {
    user: userDB.model('user', User),
    newuser: userDB.model('newuser', NewUser),
    answer: userDB.model('answer', AnswerSchema),
    question: userDB.model('question', QuestionSchema),
    passReset: userDB.model('passReset', PassReset),
};

