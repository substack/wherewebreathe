var mongoose = require('mongoose');
mongoose.set('debug', false);
module.exports = mongoose.connect('mongodb://localhost/wherewebreathe');
