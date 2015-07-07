var Schema = require('mongoose').Schema;
var db = require('./');

var AnswerSchema = new Schema({
  qid: Schema.Types.ObjectId,
  uid: Schema.Types.ObjectId,
  a: String,
  //added in later iteration so can create summary of answered by qSet on
  //dashboard
  qSet: String
}); 
var Answer = db.model('answer', AnswerSchema);
module.exports = Answer;
