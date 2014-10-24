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
  a: String,
  qSet: String//added in later iteration so can create summary of answered by qSet on dashboard
  
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
  autocomplete: Array,// array of suggested answers,
  storiesPrompt: Boolean//if true prompts user to tell story upon skip or answer (for questions with conditional questions asked based on the answer, if the question prompts the user to tell their story (true), then each conditional question will also need storiesPrompt to be set to true
});

var StoryPromptSchema = new Schema({
  heading: String, //the heading of the stories page
  subheading: String,//subheading on stories page
  seedQuestions: Array, //questions to encourage user to tell story
  qSet: String//unique, question set that the story is linked to
});

var StorySchema = new Schema({
  //uid and qSet together will be unique, like a composite key
  uid: Schema.Types.ObjectId, //user ID
  uname: String, //user name
  qSet: String,//links to question set
  story: String,
  comments: Array
})
//module.exports = userDB.model('Account', Account);

module.exports = {
    user: userDB.model('user', User),
    newuser: userDB.model('newuser', NewUser),
    answer: userDB.model('answer', AnswerSchema),
    question: userDB.model('question', QuestionSchema),
    passReset: userDB.model('passReset', PassReset),
    storyPrompt: userDB.model('storyPrompt', StoryPromptSchema),
    story: userDB.model('story', StorySchema) 
};

