var db = require('./');
var Schema = require('mongoose').Schema;

var schema = new Schema({ 
    passReset: String,
    uid: Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default : Date.now,
      expires: '24h' //expire after 24h seconds 
    }
});

var PassReset = db.model('passReset', schema);
module.exports = PassReset;
