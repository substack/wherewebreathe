#!/usr/bin/env node
// script to modify user parameters

var fs = require('fs');
var User = require('../models/user.js');
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
  alias: { h: 'help' }
});

var cmd = argv._[0];

if (argv.help) usage(0)
else if (cmd === 'set' && argv._.length === 4) { // set USER KEY VALUE
  var name = argv._[1];
  var key = argv._[2];
  var value = argv._[3];
  User.findOne({ username: name }, function (err, user) {
    if (err) return error(err);
    if (!user) return error('no such user');
    user[key] = value;
    user.save(function (err) {
      if (err) error(err)
      else process.exit(0)
    });
  });
}
else usage(1)

function usage (code) {
  var r = fs.createReadStream(__dirname + '/usage/user.txt');
  r.pipe(process.stdout);
  if (code) r.once('end', function () { process.exit(code) });
}

function error (msg) {
  console.error(msg.message || msg);
  process.exit(1);
}
