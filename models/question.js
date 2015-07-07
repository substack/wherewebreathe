var Schema = require('mongoose').Schema;
var db = require('./');

var QuestionSchema = new Schema({
  //the order questions are asked in (conditional questions dont get ordered and
  //start at 100x)
  order: Number,

  qType: String,//dropdown, radio, text
  label: String,//question helper label, not totally necessary?
  answers: Array,// can be dropdown answers
  question: String, //questioon text
  validation: String,//validation pattern
  valMsg: String, //validation warning text
  placeholder: String,//placeholder for text input
  qSet: String,//question set
  autocomplete: Array,// array of suggested answers,

  //if true prompts user to tell story upon skip or answer (for questions with
  //conditional questions asked based on the answer, if the question prompts the
  //user to tell their story (true), then each conditional question will also
  //need storiesPrompt to be set to true
  storiesPrompt: Boolean
});

var Question = db.model('question', QuestionSchema);
module.exports = Question;
