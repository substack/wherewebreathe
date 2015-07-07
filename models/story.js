var Schema = require('mongoose').Schema;
var db = require('./');

var StorySchema = new Schema({
  //uid and qSet together will be unique, like a composite key
  uid: Schema.Types.ObjectId, //user ID
  uname: String, //user name
  qSet: String,//links to question set
  story: String,
  comments: [{
    uId: Schema.Types.ObjectId,
    uname: String,
    comment: String
  }]
})
var Story = db.model('story', StorySchema);
module.exports = Story;
