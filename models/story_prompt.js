var Schema = require('mongoose').Schema;
var db = require('./');

var StoryPromptSchema = new Schema({
  heading: String, //the heading of the stories page
  subheading: String,//subheading on stories page
  seedQuestions: Array, //questions to encourage user to tell story
  qSet: String//unique, question set that the story is linked to
});

var Story = db.model('storyPrompt', StoryPromptSchema);
module.exports = Story;
